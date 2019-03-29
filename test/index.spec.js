'use strict';


/* dependencies */
const _ = require('lodash');
const { include } = require('@lykmapipo/include');
const { expect } = require('chai');
const { model, Schema, ObjectId } = require('@lykmapipo/mongoose-common');
const { clear } = require('@lykmapipo/mongoose-test-helpers');
const aggregatable = include(__dirname, '..');


/* prepare schemas */
const PersonSchema = new Schema({
  name: { type: String, fake: { generator: 'name', type: 'findName' } },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  brother: { type: ObjectId, ref: 'Person', aggregatable: { from: 'people' } },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }],
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: { unwind: true } }
});

PersonSchema.plugin(require('@lykmapipo/mongoose-faker'));
PersonSchema.plugin(aggregatable);
const Person = model('Person', PersonSchema);


describe('aggregatable', function () {

  let relatives = [Person.fake(), Person.fake()];
  let friends = [Person.fake(), Person.fake()];
  let father = Person.fake().set({ friends });
  let mother = Person.fake().set({ friends });
  let sister = Person.fake();
  let brother = Person.fake();
  let john = Person.fake().set({ father, mother, sister });
  let jean = Person.fake().set({ father, mother, sister, brother, friends });
  let jay = Person.fake().set({ father, mother, relatives });

  before(done => clear(done));

  before(done => {
    Person.insertMany([
      ...relatives, ...friends, father, mother,
      sister, brother, john, jean, jay
    ], done);
  });

  it('should collect aggregatable paths', () => {
    expect(Person.AGGREGATABLE_FIELDS).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.father).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.mother).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.sister).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.brother).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.relatives).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.friends).to.exist;
  });

  it('should not collect non aggregatable paths', () => {
    expect(Person.AGGREGATABLE_FIELDS).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.name).to.not.exist;
  });

  it('should normalize aggregatable path', () => {
    const { father } = Person.AGGREGATABLE_FIELDS;
    expect(father).to.exist;
    expect(father.localField).to.exist;
    expect(father.localField).to.be.equal('father');
    expect(father.foreignField).to.exist;
    expect(father.foreignField).to.be.equal('_id');
    expect(father.as).to.exist;
    expect(father.as).to.be.equal('father');
    expect(father.unwind).to.exist;
    expect(father.unwind.path).to.exist;
    expect(father.unwind.path).to.be.equal('$father');
    expect(father.unwind.preserveNullAndEmptyArrays).to.be.true;
    expect(father.isArray).to.be.undefined;
  });

  it('should normalize unwindable array aggregatable path', () => {
    const { relatives } = Person.AGGREGATABLE_FIELDS;
    expect(relatives).to.exist;
    expect(relatives.localField).to.exist;
    expect(relatives.localField).to.be.equal('relatives');
    expect(relatives.foreignField).to.exist;
    expect(relatives.foreignField).to.be.equal('_id');
    expect(relatives.as).to.exist;
    expect(relatives.as).to.be.equal('relative');
    expect(relatives.unwind).to.exist;
    expect(relatives.unwind.path).to.exist;
    expect(relatives.unwind.path).to.be.equal('$relative');
    expect(relatives.unwind.preserveNullAndEmptyArrays).to.be.true;
    expect(relatives.isArray).to.be.true;
  });

  it('should normalize array aggregatable path', () => {
    const { friends } = Person.AGGREGATABLE_FIELDS;
    expect(friends).to.exist;
    expect(friends.localField).to.exist;
    expect(friends.localField).to.be.equal('friends');
    expect(friends.foreignField).to.exist;
    expect(friends.foreignField).to.be.equal('_id');
    expect(friends.as).to.exist;
    expect(friends.as).to.be.equal('friends');
    expect(friends.isArray).to.be.true;
  });

  it('should be able to lookup', () => {
    expect(Person.lookup).to.exist;
    expect(Person.lookup).to.be.a('function');
  });

  it('should aggreate from aggregatable paths', done => {
    Person.lookup().exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length.at.least(1);
      done(error, people);
    });
  });

  it('should aggreate from aggregatable paths with criteria', done => {
    Person.lookup({ _id: john._id }).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(1);

      const person = _.first(people);
      expect(person.father).to.exist;
      expect(person.father._id).to.be.eql(father._id);
      expect(person.mother).to.exist;
      expect(person.mother._id).to.be.eql(mother._id);
      expect(person.sister).to.exist;
      expect(person.sister._id).to.be.eql(sister._id);
      expect(person.friends).to.be.empty;

      done(error, people);
    });
  });

  it('should aggreate from aggregatable paths with criteria', done => {
    Person.lookup({ _id: jean._id }).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(1);

      const person = _.first(people);
      expect(person.father).to.exist;
      expect(person.father._id).to.be.eql(father._id);
      expect(person.mother).to.exist;
      expect(person.mother._id).to.be.eql(mother._id);
      expect(person.sister).to.exist;
      expect(person.sister._id).to.be.eql(sister._id);
      expect(person.brother).to.exist;
      expect(person.brother._id).to.be.eql(brother._id);
      expect(person.friends).to.have.length(2);

      done(error, people);
    });
  });

  it('should aggreate from aggregatable paths with criteria', done => {
    Person.lookup({ _id: father._id }).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(1);

      const person = _.first(people);
      expect(person.father).to.not.exist;
      expect(person.mother).to.not.exist;
      expect(person.sister).to.not.exist;
      expect(person.friends).to.have.length(2);

      done(error, people);
    });
  });

  it('should aggreate from aggregatable paths with criteria', done => {
    Person.lookup({ _id: mother._id }).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(1);

      const person = _.first(people);
      expect(person.father).to.not.exist;
      expect(person.mother).to.not.exist;
      expect(person.sister).to.not.exist;
      expect(person.friends).to.have.length(2);

      done(error, people);
    });
  });

  it('should aggreate from aggregatable paths with criteria', done => {
    Person.lookup({ _id: jay._id }).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(2);

      const first = _.first(people);
      const second = _.first(people);

      expect(first._id).to.be.eql(second._id);
      expect(first.name).to.be.eql(second.name);
      expect(first.relatives).to.be.eql(second.relatives);
      expect(first.relative).to.exist;
      expect(second.relative).to.exist;

      done(error, people);
    });
  });

  after(done => clear(done));

});