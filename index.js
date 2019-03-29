'use strict';


/* dependencies */
const _ = require('lodash');
const { singularize } = require('inflection');
const { mergeObjects } = require('@lykmapipo/common');
const {
  LOOKUP_FIELDS,
  eachPath,
  model,
  toCollectionName,
  schemaTypeOptionOf
} = require('@lykmapipo/mongoose-common');


/**
 * @function isArraySchema
 * @name isArraySchema
 * @description check if schema type is array
 * @param {SchemaType} schemaType valid mongoose schema type
 * @return {Boolean} whether schema type is array
 * @since 0.2.0
 * @version 0.1.0
 * @private
 * @example
 * 
 * const isArray = isArraySchema(schemaType)
 * //=> true
 */
const isArraySchema = (schemaType = {}) => {
  const { $isMongooseArray = false, instance } = schemaType;
  const isArray = ($isMongooseArray || instance === 'Array');
  return isArray;
};


/**
 * @function isAggregatablePath
 * @name isAggregatablePath
 * @description check if schema path has aggregatable options
 * @param {SchemaType} schemaType valid mongoose schema type
 * @return {Boolean} whether schema path is aggregatable
 * @since 0.2.0
 * @version 0.1.0
 * @private
 * @example
 * 
 * const isAggregatable = isAggregatablePath(schemaType)
 * //=> true
 */
const isAggregatablePath = (schemaType = {}) => {
  const options = schemaTypeOptionOf(schemaType);
  const canBeAggregated = (options && options.aggregatable && options.ref);
  return canBeAggregated;
};


/**
 * @function collectionOf
 * @name collectionOf
 * @description obtain collection name of the ref model
 * @param {String} ref valid model ref
 * @return {String} underlying collection of the model
 * @since 0.2.0
 * @version 0.1.0
 * @private
 * @example
 * 
 * const collection = collectionOf('User');
 * //=> 'users'
 * 
 */
const collectionOf = ref => {
  // get ref model collection name
  const Ref = model(ref);
  let collectionName = (
    _.get(Ref, 'collection.name') ||
    _.get(Ref, 'collection.collectionName')
  );

  // derive collection from ref
  collectionName = (
    !_.isEmpty(collectionName) ? collectionName : toCollectionName(ref)
  );

  // return ref collection name
  return collectionName;
};


/**
 * @function normalize
 * @name normalize
 * @description normalize aggragate options
 * @param {Object} optns aggregatable path options
 * @return {Object} normalized aggregatable options
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * 
 * const options = normalize(optns);
 * //=> { from: 'users', as: 'user', ...}
 * 
 */
const normalize = optns => {
  // pick options
  let { pathName, ref, aggregatable, isArray } = mergeObjects(optns);

  // normalize aggregatable
  aggregatable = mergeObjects({}, aggregatable);

  // normalize unwind
  const unwindPath = (isArray ? singularize(pathName) : pathName);
  const unwindDefaults =
    ({ path: `$${unwindPath}`, preserveNullAndEmptyArrays: true });
  const shouldUnwind = (aggregatable.unwind || !isArray);
  aggregatable.unwind = (
    shouldUnwind ?
    mergeObjects(unwindDefaults, aggregatable.unwind) :
    undefined
  );

  // shape lookup options format as per mongodb specs
  let lookup = mergeObjects({
    from: collectionOf(ref),
    as: pathName,
    localField: pathName,
    foreignField: '_id'
  }, aggregatable);
  lookup = mergeObjects({ pathName, ref, isArray }, lookup);

  // return lookup options
  return lookup;
};


/**
 * @function collectAggregatables
 * @name collectAggregatables
 * @description collect schema aggregatable paths/fields
 * @param {String} pathName path name
 * @param {SchemaType} schemaType SchemaType of a path
 * @return {Object} hash of all schema aggregatable paths
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * 
 * const aggregatables = collectAggregatables(schema);
 * //=> { sister: { pathName: 'sister', ref: 'Person'}, ... }
 */
const collectAggregatables = schema => {
  // aggregatable map
  const aggregatables = {};

  // aggregatable path filter
  const collectAggregatablePath = (pathName, schemaType) => {
    // check if path is aggregatable
    const isAggregatable = isAggregatablePath(schemaType);

    // if aggregatable collect
    if (isAggregatable) {
      // obtain path schema type options
      const { ref, aggregatable } = schemaTypeOptionOf(schemaType);
      // check if is array
      const isArray = isArraySchema(schemaType);
      // obtain aggregatable options
      const optns = mergeObjects({ pathName, ref, aggregatable, isArray });
      // collect aggregatable schema path
      aggregatables[pathName] = normalize(optns);
    }
  };

  // collect aggregatable schema paths
  eachPath(schema, collectAggregatablePath);

  // return collect aggregatable schema paths
  return aggregatables;
};


/**
 * @function aggregatable
 * @name aggregatable
 * @description mongoose plugin to add aggregations behaviour. 
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [optns] plugin options
 * @author lally elias <lallyelias87@mail.com>
 * @see {@link https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/}
 * @see {@link https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/}
 * @see {@link https://mongoosejs.com/docs/api.html#Aggregate}
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @example
 * 
 * const aggregatable = require('@lykmapipo/mongoose-aggregatable');
 * const UserSchema = 
 *  new Schema({ parent: { type: ObjectId, ref:'User', aggregatable:true } });
 * UserSchema.plugin(aggregatable);
 *
 * User.lookup((error, users) => { ... });
 */
const aggregatable = (schema, optns) => {
  // ensure options
  const options = _.merge({}, { allowDiskUse: true }, optns);

  // collect aggregatables schema paths
  const aggregatables = collectAggregatables(schema);

  // remember aggregatable paths as model static
  schema.statics.AGGREGATABLE_FIELDS = aggregatables;

  // TODO add to Aggregate.prototype

  /**
   * @function lookup
   * @name lookup
   * @description Initialize aggregations on the model using aggregatable paths.
   * @return {Aggregate} mongoose aggregate instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @public
   * const aggregation = User.lookup();
   */
  schema.statics.lookup = function lookup(criteria /*, optns*/ ) {
    // ref curent model
    const Model = this;

    // copy aggregatables
    let aggregatables = mergeObjects({}, Model.AGGREGATABLE_FIELDS);

    // filter to allow only valid aggergatable
    const isValidAggregatable = aggregatable => {
      return !_.isEmpty(aggregatable.ref || aggregatable.from);
    };
    aggregatables = _.filter(aggregatables, isValidAggregatable);

    // ensure aggregatable collection name(i.e from collection)
    const ensureFromCollection = aggregatable => {
      aggregatable.from = collectionOf(aggregatable.ref);
      return aggregatable;
    };
    aggregatables = _.map(aggregatables, ensureFromCollection);

    // initialize aggregate query
    const aggregate = Model.aggregate();

    // pass match criteria
    if (criteria) {
      // cast criteria to actual types
      criteria = this.where(criteria).cast(this);

      // pass criteria to match aggregation stage
      aggregate.match(criteria);
    }

    // build aggregation based on aggregatables
    const buildAggregation = aggregatable => {
      // do lookup
      const lookupOptns = _.pick(aggregatable, LOOKUP_FIELDS);
      aggregate.lookup(lookupOptns);

      // do unwind
      if (aggregatable.unwind) {
        aggregate.unwind(aggregatable.unwind);
      }
    };
    _.forEach(aggregatables, buildAggregation);

    // allow disk usage for aggregation
    const { allowDiskUse } = options;
    if (allowDiskUse) {
      aggregate.allowDiskUse(true);
    }

    // return aggregate
    return aggregate;
  };
};


/* export aggregatable plugin */
module.exports = exports = aggregatable;