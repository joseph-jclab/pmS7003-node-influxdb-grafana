// Require libraries
import * as SerialPort from 'serialport';
import * as Delimiter from '@serialport/parser-delimiter';
// = require('@serialport/parser-delimiter');
import { Parser as BinaryParser } from 'binary-parser';
import * as influxdb from '@influxdata/influxdb-client';

// Init variables
const port = new SerialPort('COM3', { baudRate: 9600 });
const packetParser = port.pipe(new Delimiter({ delimiter: [0x42, 0x4d] }));

const binaryParser = new BinaryParser()
  .uint16('frameLength')
  .uint16('PM1Standard')
  .uint16('PM25Standard')
  .uint16('PM10Standard')
  .uint16('PM1Atmospheric')
  .uint16('PM25Atmospheric')
  .uint16('PM10Atmospheric')
  .uint16('PM03Plus')
  .uint16('PM05Plus')
  .uint16('PM1Plus')
  .uint16('PM25Plus')
  .uint16('PM50Plus')
  .uint16('PM100Plus');

const SENSOR_NAME = process.env.SENSOR_NAME;
const SENSOR_LOCATION = process.env.SENSOR_LOCATION;

const writeApi = new influxdb.InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN
})
  .getWriteApi(
    'iot',
    'sensors'
  );

writeApi.useDefaultTags({
  location: SENSOR_LOCATION,
  sensor_id: SENSOR_NAME
});

// Read data
packetParser.on('data', (data) => {
  const parsedData = binaryParser.parse(data);
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('CF  values:');
  console.log(`  PM 1.0 : ${parsedData.PM1Standard}`);
  console.log(`  PM 2.5 : ${parsedData.PM25Standard}`);
  console.log(`  PM10   : ${parsedData.PM10Standard}`);
  console.log('ATM values:');
  console.log(`  PM 1.0 : ${parsedData.PM1Atmospheric}`);
  console.log(`  PM 2.5 : ${parsedData.PM25Atmospheric}`);
  console.log(`  PM10   : ${parsedData.PM10Atmospheric}`);
  console.log('Other values:');
  console.log(`0.3um ${parsedData.PM03Plus} - 0.5um ${parsedData.PM05Plus} - 1.0um ${parsedData.PM1Plus} - 2.5um ${parsedData.PM25Plus} - 5.0um ${parsedData.PM50Plus} - 10um ${parsedData.PM100Plus}`)
  console.log('');

  const timestamp = new Date();
  const pointStandard = new influxdb.Point('pm_standard')
    .timestamp(timestamp)
    .intField('pm1', parsedData.PM1Standard)
    .intField('pm25', parsedData.PM25Standard)
    .intField('pm10', parsedData.PM10Standard);
  const pointAtmospheric = new influxdb.Point('pm_atm')
    .timestamp(timestamp)
    .intField('pm1', parsedData.PM1Atmospheric)
    .intField('pm25', parsedData.PM25Atmospheric)
    .intField('pm10', parsedData.PM10Atmospheric);
  const pointPlus = new influxdb.Point('pm_plus')
    .timestamp(timestamp)
    .intField('pm03', parsedData.PM03Plus)
    .intField('pm05', parsedData.PM05Plus)
    .intField('pm10', parsedData.PM1Plus)
    .intField('pm25', parsedData.PM25Plus)
    .intField('pm50', parsedData.PM50Plus)
    .intField('pm100', parsedData.PM100Plus);

  writeApi.writePoints([
    pointStandard,
    pointAtmospheric,
    pointPlus
  ]);
});
