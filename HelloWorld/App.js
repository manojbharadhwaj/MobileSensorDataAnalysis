import React from 'react';
import { Accelerometer, Gyroscope } from "react-native-sensors";
import { StyleSheet, Text, View } from 'react-native';

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
        observable.subscribe(({ x, y, z }) => this.setState({ ax: x, ay: y, az: z }));
      })
      .catch(error => {
        console.log("The sensor is not available");
      });

    new Gyroscope({ updateInterval: 50
    }).then(observable => {
       observable.subscribe(({x, y, z}) => this.setState({gx: x, gy: y, gz: z}));
    }).catch(error => {
	console.log("Gyroscope is not available");
    });

    this.state = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 };
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.headline}>Accelerometer values</Text>
        <Value name="ax" value={this.state.ax} />
        <Value name="ay" value={this.state.ay} />
        <Value name="az" value={this.state.az} />
        <Text style={styles.headline}>Gyroscope values</Text>
        <Value name="gx" value={this.state.gx} />
        <Value name="gy" value={this.state.gy} />
        <Value name="gz" value={this.state.gz} />
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
