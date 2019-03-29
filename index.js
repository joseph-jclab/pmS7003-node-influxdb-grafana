// Require libraries
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');
const BinaryParser = require('binary-parser').Parser;
const Influx = require('influx');

// Init variables
const port = new SerialPort('/dev/serial0', { baudRate: 9600 });
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
const influx = new Influx.InfluxDB({
  host: 'influxdb',
  database: 'air_quality_db',
  schema: [
    {
      measurement: 'pm_standard',
      fields: {
        pm1: Influx.FieldType.INTEGER,
        pm25: Influx.FieldType.INTEGER,
        pm10: Influx.FieldType.INTEGER
      },
      tags: []
    },
    {
      measurement: 'pm_atm',
      fields: {
        pm1: Influx.FieldType.INTEGER,
        pm25: Influx.FieldType.INTEGER,
        pm10: Influx.FieldType.INTEGER
      },
      tags: []
    },
    {
      measurement: 'pm',
      fields: {
        pm03: Influx.FieldType.INTEGER,
        pm05: Influx.FieldType.INTEGER,
        pm10: Influx.FieldType.INTEGER,
        pm25: Influx.FieldType.INTEGER,
        pm50: Influx.FieldType.INTEGER,
        pm100: Influx.FieldType.INTEGER
      },
      tags: []
    }
  ]
});


// Read data
packetParser.on('data', (data) => {
  const parsedData = binaryParser.parse(data);
  console.log(`CF  values: PM1.0 ${parsedData.PM1Standard} - PM2.5 ${parsedData.PM25Standard} - PM10 ${parsedData.PM10Standard}`);
  console.log(`ATM values: PM1.0 ${parsedData.PM1Atmospheric} - PM2.5 ${parsedData.PM25Atmospheric} - PM10 ${parsedData.PM10Atmospheric}`);
  console.log(`Other values: 0.3um ${parsedData.PM03Plus} - 0.5um ${parsedData.PM05Plus} - 1.0um ${parsedData.PM1Plus} - 2.5um ${parsedData.PM25Plus} - 5.0um ${parsedData.PM50Plus} - 10um ${parsedData.PM100Plus}`)

  // Write to influx db
  influx.writePoints([{
    measurement: 'pm_standard',
    fields: {
      pm1: parsedData.PM1Standard,
      pm25: parsedData.PM25Standard,
      pm10: parsedData.PM10Standard
    }
  }, {
    measurement: 'pm_atm',
    fields: {
      pm1: parsedData.PM1Atmospheric,
      pm25: parsedData.PM25Atmospheric,
      pm10: parsedData.PM10Atmospheric
    }
  }, {
    measurement: 'pm',
    fields: {
      pm03: parsedData.PM03Plus,
      pm05: parsedData.PM05Plus,
      pm10: parsedData.PM1Plus,
      pm25: parsedData.PM25Plus,
      pm50: parsedData.PM50Plus,
      pm100: parsedData.PM100Plus
  }
  }])
});