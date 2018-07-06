import React from 'react';
import { Magnetometer, Accelerometer, Gyroscope } from "react-native-sensors";
import { StyleSheet, Text, View, Button, Picker} from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import RNFS from 'react-native-fs';

const Value = ({ name, value }) => (
  <View style={styles.valueContainer}>
    <Text style={styles.valueName}>{name}:</Text>
    <Text style={styles.valueValue}>{new String(value).substr(0, 8)}</Text>
  </View>
);

acc_data = [];
acc_t = 0;
gyr_data = [];
gyr_t = 0;
mag_data = [];
mag_t = 0;
total_samples = 1; 
sample_length_in_msec = 5000;
interval_in_msec = 20;
datapoints = sample_length_in_msec / interval_in_msec;
start_t = 0;
available_modes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
dir_root = RNFS.DocumentDirectoryPath + "/msa";
dir_prefix = RNFS.DocumentDirectoryPath +  "/msa/mode";

function initialize() {
   // Create directories, one for each transport mode.
   for (mode in available_modes) {
      RNFS.mkdir(dir_prefix + mode); 
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
             fileName = dir_prefix + mode + "/" + (year + "" + (month < 10 ? ("0" + month) : month) + "" + (day < 10 ? ("0" + day) : day)) + ".log";
             console.log("Filename: " + fileName);
             contents = "";
             for (i=0;i<mag_data.length;i++) {
                 contents += acc_data[i][0] + "," + acc_data[i][1] + "," + acc_data[i][2] + "," + gyr_data[i][0] + "," + gyr_data[i][1] + "," + gyr_data[i][2] + "," + mag_data[i][0] + "," + mag_data[i][1] + "," + mag_data[i][2] + "\n";
             }
             RNFS.write(fileName, contents).then(()=>{
               RNFS.stat(fileName).then((result) => { console.log("Stat: ", result.size, result.path)});
             }).catch((err) => {});
             console.log("File written!");
             this.samples++;
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
     this.state = {started: false, transport_mode: 0};
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
        KeepAwake.activate();
     } else {
        KeepAwake.deactivate();
     }
  }
  
  componentDidMount() {
      KeepAwake.deactivate();
  }

  render() {
    return (
       <View style={styles.container}>
          <Value name="Runtime" value="5 minutes"/>
          <Value name="Sample size" value="5 seconds"/>
          <Value name="Sample interval" value="0.02 seconds"/>
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
    width: 200,
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
