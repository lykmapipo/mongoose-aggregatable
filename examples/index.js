import mongoose from 'mongoose';
import { connect, Schema, ObjectId } from '@lykmapipo/mongoose-common';
import aggregatable from '../src';

const PersonSchema = new Schema({
  name: { type: String },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  brother: { type: ObjectId, aggregatable: { from: 'people' } },
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }],
});
PersonSchema.plugin(aggregatable);
const Person = mongoose.model('Person', PersonSchema);

connect(() => {
  const aggregate = Person.lookup();
  aggregate.exec((error, people) => {
    console.log(error, people);
  });
});
