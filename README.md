# mongoose-aggregatable

[![Build Status](https://app.travis-ci.com/lykmapipo/mongoose-aggregatable.svg?branch=master)](https://app.travis-ci.com/lykmapipo/mongoose-aggregatable)
[![Dependencies Status](https://david-dm.org/lykmapipo/mongoose-aggregatable.svg)](https://david-dm.org/lykmapipo/mongoose-aggregatable)
[![Coverage Status](https://coveralls.io/repos/github/lykmapipo/mongoose-aggregatable/badge.svg?branch=master)](https://coveralls.io/github/lykmapipo/mongoose-aggregatable?branch=master)
[![GitHub License](https://img.shields.io/github/license/lykmapipo/mongoose-aggregatable)](https://github.com/lykmapipo/mongoose-aggregatable/blob/develop/LICENSE)

[![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![npm version](https://img.shields.io/npm/v/@lykmapipo/mongoose-aggregatable)](https://www.npmjs.com/package/@lykmapipo/mongoose-aggregatable)

mongoose plugin to add aggregations behaviour. 

## Requirements

- [NodeJS v13+](https://nodejs.org)
- [Npm v6.12+](https://www.npmjs.com/)
- [MongoDB v4+](https://www.mongodb.com/)
- [Mongoose v6+](https://github.com/Automattic/mongoose)

## Install
```sh
$ npm install --save mongoose @lykmapipo/mongoose-aggregatable
```

## Usage

```javascript
import mongoose from 'mongoose';
import aggregatable from '@lykmapipo/mongoose-aggregatable';

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  brother: { type: ObjectId, aggregatable: { from: 'people' } },
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }]
});
PersonSchema.plugin(aggregatable);
const Person = mongoose.model('Person', PersonSchema);

const aggregate = Person.lookup();
aggregate.exec((error, people) => { ... });
```

## API

### `aggregatable(schema: Schema, [options: Object])`
An aggregatable schema plugin. Once applied to a schema will allow to perform aggrgation from `aggregatable` schema field and add `lookup` model static method.

#### `options: Object`
- `allowDiskUse: Boolean` - Enable aggregation disk usage. Default to `true`.

Example
```js
const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  brother: { type: ObjectId, aggregatable: { from: 'people' } },
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }]
});
PersonSchema.plugin(aggregatable);
const Person = mongoose.model('Person', PersonSchema);
```


### `lookup([criteria: Object]) : Aggregate`
Initialize aggregations on the model using aggregatable paths and return [mongoose Aggregate](https://mongoosejs.com/docs/api.html#Aggregate) instance.

Example:
```js
const aggregate = Person.lookup();
aggregate.exec((error, people) => { ... });
```

### Schema Options
Each `aggregatable` field/path can define below options

- `from: String` - Specifies the collection in the same database to perform the lookup with. If not specified `ref` will be used to compute model collection name to lookup. [See](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/)
- `foreignField: String` - Specifies the field from the documents in the from collection. If not specified `_id` will be used. [See](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/) 

Example
```js
const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', aggregatable: true }
});

const PersonSchema = new Schema({
  name: { type: String },
  brother: { type: ObjectId, aggregatable: { from: 'people' } }
});

const PersonSchema = new Schema({
  name: { type: String },
  brother: { type: ObjectId, aggregatable: { from: 'people', foreignField: '_id' } }
});
```

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```
* Then run test
```sh
$ npm test
```

## References
- [MongoDB Aggregation Lookup](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/)
- [MongoDB Aggregation Unwind](https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/)
- [Mongoose Aggregate](https://mongoosejs.com/docs/api.html#Aggregate)

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence
The MIT License (MIT)

Copyright (c) lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
