import _ from 'lodash';
import { model, Schema, ObjectId } from '@lykmapipo/mongoose-common';
import { expect, clear } from '@lykmapipo/mongoose-test-helpers';
import mongooseFaker from '@lykmapipo/mongoose-faker';
import aggregatable from '../src';

const PersonSchema = new Schema({
  name: { type: String, fake: { generator: 'name', type: 'findName' } },
  father: { type: ObjectId, ref: 'Person', aggregatable: true },
  mother: { type: ObjectId, ref: 'Person', aggregatable: true },
  sister: { type: ObjectId, ref: 'Person', aggregatable: true },
  brother: { type: ObjectId, ref: 'Person', aggregatable: { from: 'people' } },
  friends: [{ type: ObjectId, ref: 'Person', aggregatable: true }],
  relatives: {
    type: [ObjectId],
    ref: 'Person',
    aggregatable: { unwind: true },
  },
});

PersonSchema.plugin(mongooseFaker);
PersonSchema.plugin(aggregatable);
const Person = model('Person', PersonSchema);

describe('aggregatable', () => {
  const relatives = [Person.fake(), Person.fake()];
  const friends = [Person.fake(), Person.fake()];
  const father = Person.fake().set({ friends });
  const mother = Person.fake().set({ friends });
  const sister = Person.fake();
  const brother = Person.fake();
  const john = Person.fake().set({ father, mother, sister });
  const jean = Person.fake().set({ father, mother, sister, brother, friends });
  const jay = Person.fake().set({ father, mother, relatives });

  before((done) => clear(done));

  before((done) => {
    Person.insertMany(
      [
        ...relatives,
        ...friends,
        father,
        mother,
        sister,
        brother,
        john,
        jean,
        jay,
      ],
      done
    );
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
    const { father: fatherPath } = Person.AGGREGATABLE_FIELDS;
    expect(fatherPath).to.exist;
    expect(fatherPath.localField).to.exist;
    expect(fatherPath.localField).to.be.equal('father');
    expect(fatherPath.foreignField).to.exist;
    expect(fatherPath.foreignField).to.be.equal('_id');
    expect(fatherPath.as).to.exist;
    expect(fatherPath.as).to.be.equal('father');
    expect(fatherPath.unwind).to.exist;
    expect(fatherPath.unwind.path).to.exist;
    expect(fatherPath.unwind.path).to.be.equal('$father');
    expect(fatherPath.unwind.preserveNullAndEmptyArrays).to.be.true;
    expect(fatherPath.isArray).to.be.false;
  });

  it('should normalize unwindable array aggregatable path', () => {
    const { relatives: relativesPath } = Person.AGGREGATABLE_FIELDS;
    expect(relativesPath).to.exist;
    expect(relativesPath.localField).to.exist;
    expect(relativesPath.localField).to.be.equal('relatives');
    expect(relativesPath.foreignField).to.exist;
    expect(relativesPath.foreignField).to.be.equal('_id');
    expect(relativesPath.as).to.exist;
    expect(relativesPath.as).to.be.equal('relative');
    expect(relativesPath.unwind).to.exist;
    expect(relativesPath.unwind.path).to.exist;
    expect(relativesPath.unwind.path).to.be.equal('$relative');
    expect(relativesPath.unwind.preserveNullAndEmptyArrays).to.be.true;
    expect(relativesPath.isArray).to.be.true;
  });

  it('should normalize array aggregatable path', () => {
    const { friends: friendsPath } = Person.AGGREGATABLE_FIELDS;
    expect(friendsPath).to.exist;
    expect(friendsPath.localField).to.exist;
    expect(friendsPath.localField).to.be.equal('friends');
    expect(friendsPath.foreignField).to.exist;
    expect(friendsPath.foreignField).to.be.equal('_id');
    expect(friendsPath.as).to.exist;
    expect(friendsPath.as).to.be.equal('friends');
    expect(friendsPath.isArray).to.be.true;
  });

  it('should be able to lookup', () => {
    expect(Person.lookup).to.exist;
    expect(Person.lookup).to.be.a('function');
  });

  it('should aggregate from aggregatable paths', (done) => {
    Person.lookup().exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length.at.least(1);
      done(error, people);
    });
  });

  it('should aggregate from aggregatable paths with criteria', (done) => {
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

  it('should aggregate from aggregatable paths with criteria', (done) => {
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

  it('should aggregate from aggregatable paths with criteria', (done) => {
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

  it('should aggregate from aggregatable paths with criteria', (done) => {
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

  it('should aggregate from aggregatable paths with criteria', (done) => {
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

  it('should remove excluded path from aggregation', (done) => {
    const criteria = { _id: jay._id };
    const optns = { exclude: ['relatives', 'mother'] };
    Person.lookup(criteria, optns).exec((error, people) => {
      expect(error).to.not.exist;
      expect(people).to.exist;
      expect(people).to.have.length(1);

      const first = _.first(people);

      expect(first._id).to.be.eql(jay._id);
      expect(first.name).to.be.eql(jay.name);
      expect(first.mother).to.exist;
      expect(first.father).to.have.a.property('_id');
      expect(first.relative).to.not.exist;
      expect(first.relatives).to.exist;

      done(error, people);
    });
  });

  after((done) => clear(done));
});
