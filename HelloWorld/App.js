import React from 'react';
import { Magnetometer, Accelerometer, Gyroscope } from "react-native-sensors";
import { StyleSheet, Text, View, Button, Picker} from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import RNFS from 'react-native-fs';
import {zip} from 'react-native-zip-archive';
import { AsyncStorage, TextInput } from 'react-native';
import firebase from 'react-native-firebase';

storage = firebase.storage();

const Value = ({ name, value }) => (
  <View style={styles.valueContainer}>
    <Text style={styles.valueName}>{name}:</Text>
    <Text style={styles.valueValue}>{value}</Text>
  </View>
);

acc_data = [];
acc_t = 0;
gyr_data = [];
gyr_t = 0;
mag_data = [];
mag_t = 0;
total_samples = 12; 
sample_length_in_msec = 5000;
interval_in_msec = 20;
datapoints = sample_length_in_msec / interval_in_msec;
start_t = 0;
available_modes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
dir_root = RNFS.DocumentDirectoryPath + "/msa";
dir_prefix = RNFS.DocumentDirectoryPath +  "/msa/mode";
sampleFileName = "";

function initialize() {
   // Create directories, one for each transport mode.
   for (mode in available_modes) {
      RNFS.mkdir(dir_prefix + mode); 
/*      RNFS.readDir(dir_prefix + mode).then((result) => {
         for (item_no = 0; item_no < result.length ; item_no++) {
            console.log("filelist", result[item_no].path, result[item_no].size); 
         } 
      }).catch((err) => {
        
      }); */
   }
}

initialize();

export default class App extends React.Component {
  
   log_data(x, y, z, t, type, mode) {
      if (type == 'M') {
        if (mag_t < t && mag_data.length < datapoints) {
            mag_data.push([x, y, z]);
            mag_t = t;
        }
      } else if (type == 'G') {
        if (gyr_t < t && gyr_data.length < datapoints) {
            gyr_data.push([x, y, z]);
            gyr_t = t;
        }
      } else if (type == 'A') {
         if (acc_t < t && acc_data.length < datapoints) {
            acc_data.push([x, y, z]);
            acc_t = t;
         }
      }
      if (mag_data.length == datapoints && gyr_data.length == datapoints && acc_data.length == datapoints) {
          if (this.state.started) {
             today = new Date();
             day = today.getDate();
             month = today.getMonth() + 1;
             year = today.getFullYear();
             mode =  this.state.transport_mode;
             time_in_millis = Date.now();
             contents = "";
             for (i=0;i<mag_data.length;i++) {
                 contents += acc_data[i][0] + "," + acc_data[i][1] + "," + acc_data[i][2] + "," + gyr_data[i][0] + "," + gyr_data[i][1] + "," + gyr_data[i][2] + "," + mag_data[i][0] + "," + mag_data[i][1] + "," + mag_data[i][2] + "\n";
             }
             RNFS.write(sampleFileName, contents).then(function(){
                 console.log("Logged file: " + sampleFileName);
                 if (this.samples >= total_samples) {
                    // Zip the file and delete the .log file and try to upload the file.
                    const sourcePath = sampleFileName;
                    const targetPath = sourcePath.replace(/log$/, "zip");
                    const referencePath = targetPath.replace(dir_root, "");
                    console.log("zip file name: ", targetPath);
                    this.setState({status: "Zipping the sample data file"});
                    zip(sourcePath, targetPath)
                       .then(function(path)  {
                           console.log("zip completed at ", path);
                           this.setState({status: "Trying to upload the compressed file"});
                           RNFS.unlink(sourcePath).then(() => {console.log("File deleted! ", sourcePath);}).catch((err) => {console.log("unable to delete file", sourcePath, err.message);});
                           console.log("Reference path: ", referencePath);
                           storage.ref(referencePath).putFile(targetPath).then(function() { this.setState({status: "Data sample uploaded! Press start to collect another sample!"}); RNFS.unlink(targetPath).then(() => console.log("File uploaded and deleted!", targetPath))}.bind(this)).catch((err) => console.log("Unable to upload", err.message));
                       }.bind(this))
                       .catch((error) => {
			   this.setState({status: "Error while zipping the file"});
                           console.log("Error while zipping", error)
                    });       
                 }
             }.bind(this)).catch((err) => {});
             console.log("File written!");
             this.samples++;
             this.setState({status: "Collected " + this.samples + "/" + total_samples + " samples. Time remaining: " + ((total_samples - this.samples) * sample_length_in_msec / 1000 ) + " seconds."});
             if (this.samples >= total_samples) {
                this.toggle_and_reset();
             }
          }
          mag_data = [];
          gyr_data = [];
          acc_data = [];
      }
   }

   constructor(props) {
    super(props);
    this.samples = 0;

    new Accelerometer({
      updateInterval: interval_in_msec // defaults to 100ms
    })
      .then(function(observable){
        observable.subscribe(({ x, y, z, timestamp }) => this.log_data(x, y, z, timestamp, 'A'));
      }.bind(this))
      .catch(error => {
        console.log("The sensor is not available");
      });

    new Gyroscope({ updateInterval: interval_in_msec
    }).then(function(observable) {
       observable.subscribe(({x, y, z, timestamp}) => this.log_data(x, y, z, timestamp, 'G'));
    }.bind(this)).catch(error => {
	console.log("Gyroscope is not available");
    });
    
    new Magnetometer({ updateInterval: interval_in_msec})
      .then(function(observable)  { observable.subscribe(({x, y, z, timestamp}) => this.log_data(x, y, z, timestamp, 'M'));
     }.bind(this)).catch(error => {
        console.log("Magnetometer is not available");
     });
     this.state = {started: false, transport_mode: 0, gcpkey: "", status: "Select what you are doing now and press start to collect data"};
  }
  
  toggle_and_reset() {
     if (!this.state.started) {
       console.log("Cleared....");
       mag_data = [];
       gyr_data = [];
       acc_data = [];
     }
     started = !this.state.started;
     this.setState({started: started});
     if (started) {
        time_in_millis = Date.now();
        sampleFileName = dir_prefix + this.state.transport_mode + "/" + time_in_millis + "" + (Math.floor(Math.random() * 10000) + 1) + ".log";
        KeepAwake.activate();
        this.setState({status: "Starting to collect data"});
     } else {
        KeepAwake.deactivate();
        this.setState({status: "Select what you are doing now and press start to collect data"});
     }
  }
  
  componentDidMount() {
      KeepAwake.deactivate();
      AsyncStorage.getItem('msa:gcpkey', function(err, result) {
         if (result) {
           this.setState({gcpkey: result});
         }
      }.bind(this));
  }

  setGCPKey(gcpkey) {
      gcpkey = gcpkey.trim();
      AsyncStorage.setItem('msa:gcpkey', gcpkey, () => {
         this.setState({gcpkey: gcpkey});
      });
  }

  render() {
    return (
       <View style={styles.container}>
          <Picker
            selectedValue={this.state.transport_mode}
            style={{width: 200, height: 10}}
            onValueChange={(itemValue, itemIndex) => this.setState({transport_mode: itemValue})}>
            <Picker.Item label="Idle" value="0" />
            <Picker.Item label="Walking" value="1" />
            <Picker.Item label="Running" value="2" />
            <Picker.Item label="Cycling" value="3" />
            <Picker.Item label="Bike" value="4" />
            <Picker.Item label="Auto" value="5" />
            <Picker.Item label="Car" value="6" />
            <Picker.Item label="Bus" value="7" />
            <Picker.Item label="Tram" value="8" />
            <Picker.Item label="Train" value="9" />
            <Picker.Item label="Metro" value="10" />
            <Picker.Item label="Flight" value="11" />
            <Picker.Item label="Boat" value="12" />
          </Picker>
          <Button title={this.state.started? "Stop" : "Start"} onPress={() => this.toggle_and_reset()} />
          <Value name="status" value={this.state.status} />
       </View>
     /*
      <View style={styles.container}>
        <Text style={styles.headline}>Accelerometer values</Text>
        <Value name="ax" value={this.state.ax} />
        <Value name="ay" value={this.state.ay} />
        <Value name="az" value={this.state.az} />
        <Value name="at" value={this.state.at} />
        <Text style={styles.headline}>Gyroscope values</Text>
        <Value name="gx" value={this.state.gx} />
        <Value name="gy" value={this.state.gy} />
        <Value name="gz" value={this.state.gz} /> 
        <Value name="gt" value={this.state.gt} />
        <Text style={styles.headline}>Magnetometer values</Text>
        <Value name="mx" value={this.state.mx} />
        <Value name="my" value={this.state.my} />
        <Value name="mz" value={this.state.mz} />
        <Value name="mt" value={this.state.mt} />
      </View>
      */
    );
  } 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  headline: {
    fontSize: 10,
    textAlign: "center",
    margin: 10
  },
  valueContainer: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  valueValue: {
    width: 300,
    fontSize: 10
  },
  valueName: {
    width: 50,
    fontSize: 10,
    fontWeight: "bold"
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});
