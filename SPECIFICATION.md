## Specification

### Single Refs

#### Pseudocode
- Collect all `refs path` marked as `aggregatable`
- Build `$lookup` options
	- Prepare `from` by pluralize path ref value
	- Prepare `as` by singularize path name
	- Use path name as `localField`
	- Use `_id` as `foreignField`
- Generate `unwind` options to set single document on path
	- Set `preserveNullAndEmptyArrays` to true
	- Set `path` same as derived `as`

#### Setup

- With no options
```js
const Person = new Schema({
  sister: { type: ObjectId, ref: 'Person', aggregatable: true }
});
```

- With options
```js
const Person = new Schema({
  sister: {
    type: ObjectId,
    ref: 'Person',
    aggregatable: {
      from: 'users',
      localField: 'sister',
      foreignField: '_id',
      as: 'sister'
    }
  }
});
```

#### Querying
```js
Person.lookup((error, people) => { ... }); 
//=> { sister: { _id: ... } };
```


### Array of Refs

#### Pseudocode
- Collect all `refs path` marked as `aggregatable`
- Build `$lookup` options
	- Prepare `from` by pluralize path ref value
	- Prepare `as` by pluralize path name
	- Use path name as `localField`
	- Use `_id` as `foreignField`
- If `unwind` enabled
	- Generate `unwind` options to set documents on path
	- Set `preserveNullAndEmptyArrays` to true
	- Set `path` as singularized `as`

#### Setup

- With no options
```js
const Person = new Schema({
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true }
});

// or

const Person = new Schema({
  relatives: [{ type: ObjectId, ref: 'Person', aggregatable: true }]
});
```

- Unwind with no options
```js
const Person = new Schema({
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: {unwind: true } }
});
```

- With options
```js
const Person = new Schema({
  relatives: {
    type: [ObjectId],
    ref: 'Person',
    aggregatable: {
      from: 'users',
      localField: 'sister',
      foreignField: '_id',
      as: 'sister'
    }
  }
});
```

- Unwind with options
```js
const Person = new Schema({
  relatives: {
    type: [ObjectId],
    ref: 'Person',
    aggregatable: {
      from: 'users',
      localField: 'sister',
      foreignField: '_id',
      as: 'sister',
      unwind: true
    }
  }
});
```

#### Querying

- Without unwind - Useful if you dont want to use `populate`
```js
Person.lookup((error, people) => { ... }); 
//=> { bothers: [{ _id: ... }] };
```

- With unwind - Useful for analytics
```js
Person.lookup((error, people) => { ... }); 
//=> [{ bother: { _id: ... } }, { bother: { _id: ... } }, ...];
```