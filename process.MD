after selecting one device we have to call this api for getting the details of device where the deviceId is the selected device 

curl --url 'https://app.sochiot.com/api/config-engine/device/{deviceId}' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'Connection: keep-alive' \
  -H 'Origin: https://reports.sochiot.com' \
  -H 'Referer: https://reports.sochiot.com/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36' \
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiYWN0aW9uIjoiYXV0aCIsInRva2VuLXZlcnNpb24iOjAsImlhdCI6MTc4OTE5OTI1NCwiZXhwIjoxNzg5Mjg1NjU0fQ.J0gDRTSrvB5aJSfQYVQlySDR6-KqxAdHTXS7gLWLn-g' \
  -H 'sec-ch-ua: "Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'

  and we will get the response like this 
  {
    "id": 780,
    "uuid": "4f8fee37-3a5b-425f-bf3d-13666bfc0f6f",
    "name": "IJ_165",
    "hardwareId": "9454c5f379c8252",
    "floorId": null,
    "icon": "device",
    "locationId": 42,
    "locationName": "Apollo Pipes",
    "mode": {
        "name": "ONLINE",
        "displayName": "Online"
    },
    "version": 4787,
    "latitude": null,
    "longitude": null,
    "organizationId": 7,
    "lastUpdatedInMillis": 1788434969412,
    "deviceTemplateVO": {
        "id": 135,
        "name": "IJ_MACHINE_REV.01",
        "version": 0,
        "lastUpdatedInMillis": 1749099540050,
        "description": null,
        "moduleTemplates": [
            {
                "id": 183,
                "name": "IJ_MACHINES_Rev.01",
                "moduleSubType": "IJ_MACHINE",
                "moduleTypeVO": {
                    "id": 22,
                    "name": "IJ_MACHINES",
                    "displayName": "IJ_MACHINE",
                    "version": 0,
                    "moduleTypeNumber": 65,
                    "lastUpdatedInMillis": 1739946077065,
                    "description": "INJECTION MOLDING MACHINES",
                    "imported": false,
                    "inUse": true
                },
                "lastUpdatedInMillis": 1749099277864,
                "eventFieldVOs": [
                    {
                        "id": 2674,
                        "fieldName": "OFF_TIME",
                        "displayName": "OFF_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514604,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2675,
                        "fieldName": "ON_TIME",
                        "displayName": "ON_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514605,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2676,
                        "fieldName": "IDLE_TIME",
                        "displayName": "IDLE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514607,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2677,
                        "fieldName": "COUNTER",
                        "displayName": "COUNTER",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514608,
                        "unit": null,
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2678,
                        "fieldName": "CLOSE_TIME",
                        "displayName": "CLOSE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514608,
                        "unit": "Secs",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2679,
                        "fieldName": "OPEN_TIME",
                        "displayName": "OPEN_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514609,
                        "unit": "Secs",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    }
                ],
                "version": 1,
                "moduleName": "1",
                "moduleNumber": 1,
                "settingFieldVOList": [
                    {
                        "id": 2442,
                        "fieldName": "IDLE_TIME",
                        "displayName": "IDLE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514612,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "5",
                        "unit": "MINUTES",
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2443,
                        "fieldName": "STATUS_INPUT_TYPE",
                        "displayName": "STATUS_INPUT_TYPE",
                        "dataType": {
                            "name": "SINGLE_SELECT_LIST",
                            "displayName": "Single Select List"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "DI1",
                            "DI2",
                            "MODBUS"
                        ],
                        "lastUpdatedInMillis": 1749099514612,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "DI1",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2444,
                        "fieldName": "STATUS_INPUT_MODBUS",
                        "displayName": "STATUS_INPUT_MODBUS",
                        "dataType": {
                            "name": "TEXT_SHORT",
                            "displayName": "Text Short"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514613,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "(1)3,1",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2445,
                        "fieldName": "COUNTER_INPUT_TYPE",
                        "displayName": "COUNTER_INPUT_TYPE",
                        "dataType": {
                            "name": "SINGLE_SELECT_LIST",
                            "displayName": "Single Select List"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "DI1",
                            "DI2",
                            "MODBUS"
                        ],
                        "lastUpdatedInMillis": 1749099514615,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "DI2",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2446,
                        "fieldName": "COUNTER_INPUT_MODBUS",
                        "displayName": "COUNTER_INPUT_MODBUS",
                        "dataType": {
                            "name": "TEXT_SHORT",
                            "displayName": "Text Short"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514615,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "(1)3,2",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2447,
                        "fieldName": "RESET_HOUR",
                        "displayName": "RESET_HOUR",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514617,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "8",
                        "unit": "Hrs",
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2448,
                        "fieldName": "RESET_MINUTE",
                        "displayName": "RESET_MINUTE",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514619,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Mins",
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2441,
                        "fieldName": "STATE",
                        "displayName": "STATE",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "0",
                            "1"
                        ],
                        "lastUpdatedInMillis": 1749099514610,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": true
                    },
                    {
                        "id": 2449,
                        "fieldName": "CLOSE_TIME",
                        "displayName": "Close Time",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514620,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Secs",
                        "multiplier": 1.0,
                        "command": false
                    },
                    {
                        "id": 2450,
                        "fieldName": "OPEN_TIME",
                        "displayName": "Open Time",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514622,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Secs",
                        "multiplier": 1.0,
                        "command": false
                    }
                ],
                "imported": false,
                "inUse": false
            }
        ],
        "imported": false,
        "inUse": true
    },
    "modules": [
        {
            "id": 2763,
            "name": "1",
            "locationId": null,
            "moduleNumber": 1,
            "moduleTemplateVO": {
                "id": 183,
                "name": "IJ_MACHINES_Rev.01",
                "moduleSubType": "IJ_MACHINE",
                "moduleTypeVO": {
                    "id": 22,
                    "name": "IJ_MACHINES",
                    "displayName": "IJ_MACHINE",
                    "version": 0,
                    "moduleTypeNumber": 65,
                    "lastUpdatedInMillis": 1739946077065,
                    "description": "INJECTION MOLDING MACHINES",
                    "imported": false,
                    "inUse": true
                },
                "lastUpdatedInMillis": 1749099277864,
                "eventFieldVOs": [
                    {
                        "id": 2674,
                        "fieldName": "OFF_TIME",
                        "displayName": "OFF_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514604,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2675,
                        "fieldName": "ON_TIME",
                        "displayName": "ON_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514605,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2676,
                        "fieldName": "IDLE_TIME",
                        "displayName": "IDLE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514607,
                        "unit": "mins",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2677,
                        "fieldName": "COUNTER",
                        "displayName": "COUNTER",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514608,
                        "unit": null,
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2678,
                        "fieldName": "CLOSE_TIME",
                        "displayName": "CLOSE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514608,
                        "unit": "Secs",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    },
                    {
                        "id": 2679,
                        "fieldName": "OPEN_TIME",
                        "displayName": "OPEN_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "required": true,
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514609,
                        "unit": "Secs",
                        "moduleTemplateId": 183,
                        "multiplier": 1.0
                    }
                ],
                "inUse": false
            },
            "eventFieldVOS": [
                {
                    "id": 2674,
                    "fieldName": "OFF_TIME",
                    "displayName": "OFF_TIME",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514604,
                    "unit": "mins",
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                },
                {
                    "id": 2675,
                    "fieldName": "ON_TIME",
                    "displayName": "ON_TIME",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514605,
                    "unit": "mins",
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                },
                {
                    "id": 2676,
                    "fieldName": "IDLE_TIME",
                    "displayName": "IDLE_TIME",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514607,
                    "unit": "mins",
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                },
                {
                    "id": 2677,
                    "fieldName": "COUNTER",
                    "displayName": "COUNTER",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514608,
                    "unit": null,
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                },
                {
                    "id": 2678,
                    "fieldName": "CLOSE_TIME",
                    "displayName": "CLOSE_TIME",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514608,
                    "unit": "Secs",
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                },
                {
                    "id": 2679,
                    "fieldName": "OPEN_TIME",
                    "displayName": "OPEN_TIME",
                    "dataType": {
                        "name": "INTEGER",
                        "displayName": "Integer"
                    },
                    "required": true,
                    "supportedValues": [],
                    "lastUpdatedInMillis": 1749099514609,
                    "unit": "Secs",
                    "moduleTemplateId": 183,
                    "multiplier": 1.0
                }
            ],
            "moduleFieldMappingVOS": [
                {
                    "moduleFieldMappingId": 14448,
                    "currentValue": "1",
                    "settingFieldVO": {
                        "id": 2441,
                        "fieldName": "STATE",
                        "displayName": "STATE",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "0",
                            "1"
                        ],
                        "lastUpdatedInMillis": 1749099514610,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": true
                    }
                },
                {
                    "moduleFieldMappingId": 14441,
                    "currentValue": "5",
                    "settingFieldVO": {
                        "id": 2442,
                        "fieldName": "IDLE_TIME",
                        "displayName": "IDLE_TIME",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514612,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "5",
                        "unit": "MINUTES",
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14442,
                    "currentValue": "DI1",
                    "settingFieldVO": {
                        "id": 2443,
                        "fieldName": "STATUS_INPUT_TYPE",
                        "displayName": "STATUS_INPUT_TYPE",
                        "dataType": {
                            "name": "SINGLE_SELECT_LIST",
                            "displayName": "Single Select List"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "DI1",
                            "DI2",
                            "MODBUS"
                        ],
                        "lastUpdatedInMillis": 1749099514612,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "DI1",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14443,
                    "currentValue": "(1)3,1",
                    "settingFieldVO": {
                        "id": 2444,
                        "fieldName": "STATUS_INPUT_MODBUS",
                        "displayName": "STATUS_INPUT_MODBUS",
                        "dataType": {
                            "name": "TEXT_SHORT",
                            "displayName": "Text Short"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514613,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "(1)3,1",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14444,
                    "currentValue": "DI2",
                    "settingFieldVO": {
                        "id": 2445,
                        "fieldName": "COUNTER_INPUT_TYPE",
                        "displayName": "COUNTER_INPUT_TYPE",
                        "dataType": {
                            "name": "SINGLE_SELECT_LIST",
                            "displayName": "Single Select List"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [
                            "DI1",
                            "DI2",
                            "MODBUS"
                        ],
                        "lastUpdatedInMillis": 1749099514615,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "DI2",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14445,
                    "currentValue": "(1)3,2",
                    "settingFieldVO": {
                        "id": 2446,
                        "fieldName": "COUNTER_INPUT_MODBUS",
                        "displayName": "COUNTER_INPUT_MODBUS",
                        "dataType": {
                            "name": "TEXT_SHORT",
                            "displayName": "Text Short"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514615,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "(1)3,2",
                        "unit": null,
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14446,
                    "currentValue": "7",
                    "settingFieldVO": {
                        "id": 2447,
                        "fieldName": "RESET_HOUR",
                        "displayName": "RESET_HOUR",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514617,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "8",
                        "unit": "Hrs",
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14447,
                    "currentValue": "0",
                    "settingFieldVO": {
                        "id": 2448,
                        "fieldName": "RESET_MINUTE",
                        "displayName": "RESET_MINUTE",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514619,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Mins",
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14449,
                    "currentValue": "1",
                    "settingFieldVO": {
                        "id": 2449,
                        "fieldName": "CLOSE_TIME",
                        "displayName": "Close Time",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514620,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Secs",
                        "multiplier": 1.0,
                        "command": false
                    }
                },
                {
                    "moduleFieldMappingId": 14450,
                    "currentValue": "0",
                    "settingFieldVO": {
                        "id": 2450,
                        "fieldName": "OPEN_TIME",
                        "displayName": "Open Time",
                        "dataType": {
                            "name": "INTEGER",
                            "displayName": "Integer"
                        },
                        "moduleTypeVO": {
                            "id": 22,
                            "name": "IJ_MACHINES",
                            "displayName": "IJ_MACHINE",
                            "version": 0,
                            "moduleTypeNumber": 65,
                            "lastUpdatedInMillis": 1739946077065,
                            "description": "INJECTION MOLDING MACHINES",
                            "imported": false,
                            "inUse": true
                        },
                        "supportedValues": [],
                        "lastUpdatedInMillis": 1749099514622,
                        "commandAlias": null,
                        "moduleTemplateId": null,
                        "defaultValue": "0",
                        "unit": "Secs",
                        "multiplier": 1.0,
                        "command": false
                    }
                }
            ]
        }
    ],
    "parent": {
        "id": 343,
        "name": "M022N3LN0MN165",
        "gatewayType": {
            "name": "CLUSTER",
            "displayName": "cluster"
        },
        "gatewayUuid": "708e22ec-a6f9-4887-a256-92583ed72676",
        "hardwareId": "9454c5f379c8",
        "hasDeviceConnectivity": true,
        "parent": null
    },
    "moving": false
}

where we have to spread the modules array to get the all modules, if we are extending one module we will get eventFieldVOS which will give us all the events and if we are extending moduleFieldMappingVOS ->settingFieldVO->we will get settings one by one.
if there is anything other easy way to get all the modules, events and settings please let me know