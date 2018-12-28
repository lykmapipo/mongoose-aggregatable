# mongoose-exportable

[![Build Status](https://travis-ci.org/lykmapipo/mongoose-exportable.svg?branch=master)](https://travis-ci.org/lykmapipo/mongoose-exportable)
[![Dependencies Status](https://david-dm.org/lykmapipo/mongoose-exportable/status.svg)](https://david-dm.org/lykmapipo/mongoose-exportable)

mongoose plugin to add exports behaviour. 

## Requirements

- NodeJS v9.3+

## Install
```sh
$ npm install --save mongoose @lykmapipo/mongoose-exportable
```

## Usage

```javascript
const mongoose = require('mongoose');
const exportable = require('@lykmapipo/mongoose-exportable');

const UserSchema = new Schema({ name: { type: String, exportable: true } });
UserSchema.plugin(exportable);
const User = mongoose.model('User', UserSchema);

const writeStream = ...;
const readStream = User.exportJSON();
readStream.pipe(writeStream);

const writeStream = ...;
const readStream = User.exportCSV();
readStream.pipe(writeStream);
```

## API

### `exportable(schema: Schema, [options: Object])`
A exportable schema plugin. Once applied to a schema will allow to compute tags from `exportable` schema field and and `tag` and `untag` instance methods

Example
```js
const UserSchema = new Schema({ name: { type: String, exportable: true } });
UserSchema.plugin(exportable);
const User = mongoose.model('User', UserSchema);

const UserSchema = new Schema({ name: { type: String, exportable: true } });
UserSchema.plugin(exportable);
const User = mongoose.model('User', UserSchema);
```


### `exportCSV([criteria: Object])`
Create `csv` export readable stream.

Example:
```js
const writeStream = ...;
const readStream = User.exportCSV();
readStream.pipe(writeStream);
```

### `exportJSON([criteria: Object]): ReadableStream`
Create `json` export readable stream.

Example:
```js
const writeStream = ...;
const readStream = User.exportJSON();
readStream.pipe(writeStream);
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

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence
The MIT License (MIT)

Copyright (c) 2018 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 