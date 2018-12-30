'use strict';


/* dependencies */
const { include } = require('@lykmapipo/include');
const { expect } = require('chai');
const { model, Schema, ObjectId } = require('@lykmapipo/mongoose-common');
const { clear } = require('@lykmapipo/mongoose-test-helpers');
const taggable = include(__dirname, '..');


/* prepare schemas */
const PersonSchema = new Schema({
  name: { type: String, fake: { generator: 'name', type: 'findName' } },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  relatives: { type: [ObjectId], ref: 'Person', aggregatable: true },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }]
});

PersonSchema.plugin(require('@lykmapipo/mongoose-faker'));
PersonSchema.plugin(taggable);
const Person = model('Person', PersonSchema);


describe('aggregatable', function () {

  let father = Person.fake();
  let mother = Person.fake();
  let sister = Person.fake();
  let relatives = [Person.fake(), Person.fake()];
  let friends = [Person.fake(), Person.fake()];

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
    Person.insertMany(friends, (error, created) => {
      friends = created;
      done(error, created);
    });
  });

  it('should collect aggregatable paths', () => {
    expect(Person.AGGREGATABLE_FIELDS).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.father).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.mother).to.exist;
    expect(Person.AGGREGATABLE_FIELDS.sister).to.exist;
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
    expect(father.isArray).to.be.false;
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

  after(done => clear(done));

});