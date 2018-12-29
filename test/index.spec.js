'use strict';


/* dependencies */
const _ = require('lodash');
const faker = require('@benmaruchu/faker');
// const { include } = require('@lykmapipo/include');
// const { expect } = require('chai');
const { model, Schema, ObjectId } = require('@lykmapipo/mongoose-common');
const { clear } = require('@lykmapipo/mongoose-test-helpers');


/* prepare schemas */
const FriendSchema = new Schema({
  type: { type: String, fake: { generator: 'name', type: 'findName' } },
  person: { type: ObjectId, ref: 'Person', aggregatable: true }
});

const PersonSchema = new Schema({
  name: { type: String, fake: { generator: 'name', type: 'findName' } },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true },
  referees: [{ type: ObjectId, ref: 'Person', aggregatable: true }],
  friends: { type: [FriendSchema] },
  neighbours: [FriendSchema]
});

PersonSchema.plugin(require('@lykmapipo/mongoose-faker'));
// PersonSchema.plugin(include(__dirname, '..'));
const Person = model('Person', PersonSchema);


describe('aggregatable', function () {

  let father = Person.fake();
  let mother = Person.fake();
  let sister = Person.fake();
  let relatives = [Person.fake(), Person.fake()];
  let referees = [Person.fake(), Person.fake()];
  let friends = [Person.fake(), Person.fake()];
  let neighbours = [Person.fake(), Person.fake()];

  before(done => clear(done));

  before((done) => {
    Person.create(father, (error, created) => {
      father = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.create(mother, (error, created) => {
      mother = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.create(sister, (error, created) => {
      sister = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(relatives, (error, created) => {
      relatives = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(referees, (error, created) => {
      referees = created;
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(friends, (error, created) => {
      friends = _.map(created, (friend) => {
        return {
          type: faker.hacker.ingverb(),
          person: friend
        };
      });
      done(error, created);
    });
  });

  before((done) => {
    Person.insertMany(neighbours, (error, created) => {
      neighbours = _.map(created, (neighbour) => {
        return {
          type: faker.hacker.ingverb(),
          person: neighbour
        };
      });
      done(error, created);
    });
  });

  after(done => clear(done));

});