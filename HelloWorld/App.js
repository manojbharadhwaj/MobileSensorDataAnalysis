import React from 'react';
import { Magnetometer, Accelerometer, Gyroscope } from "react-native-sensors";
import { StyleSheet, Text, View } from 'react-native';
import KeepAwake from 'react-native-keep-awake';

const Value = ({ name, value }) => (
  <View style={styles.valueContainer}>
    <Text style={styles.valueName}>{name}:</Text>
    <Text style={styles.valueValue}>{new String(value).substr(0, 8)}</Text>
  </View>
);

export default class App extends React.Component {
   constructor(props) {
    super(props);

    new Accelerometer({
      updateInterval: 400 // defaults to 100ms
    })
      .then(observable => {
        observable.subscribe(({ x, y, z, timestamp }) => this.setState({ ax: x, ay: y, az: z, at: timestamp }));
      })
      .catch(error => {
        console.log("The sensor is not available");
      });

    new Gyroscope({ updateInterval: 50
    }).then(observable => {
       observable.subscribe(({x, y, z, timestamp}) => this.setState({gx: x, gy: y, gz: z, gt: timestamp}));
    }).catch(error => {
	console.log("Gyroscope is not available");
    });
    
    new Magnetometer({ updateInterval: 200})
      .then(observable => { observable.subscribe(({x, y, z, timestamp}) => this.setState({mx: x, my: y, mz: z, mt: timestamp}));
     }).catch(error => {
        console.log("Magnetometer is not available");
     });
    this.state = { ax: 0, ay: 0, az: 0, at: 0, gx: 0, gy: 0, gz: 0, gt: 0, mx: 0, my: 0, mz: 0, mt: 0 };
  }
  
  componentDidMount() {
    KeepAwake.activate();
  }

  render() {
    return (
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
    fontSize: 30,
    textAlign: "center",
    margin: 10
  },
  valueContainer: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  valueValue: {
    width: 200,
    fontSize: 20
  },
  valueName: {
    width: 50,
    fontSize: 20,
    fontWeight: "bold"
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});
