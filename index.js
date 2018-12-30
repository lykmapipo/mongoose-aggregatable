'use strict';


/* dependencies */
const _ = require('lodash');
const inflection = require('inflection');
const { eachPath, model } = require('@lykmapipo/mongoose-common');


/* constants */
const LOOKUP_FIELDS = ['from', 'localField', 'foreignField', 'as'];


/**
 * @function normalizeAggregatable
 * @name normalizeAggregatable
 * @description normalize aggragate options
 * @param {Object} optns aggregatable path options
 * @return {Object} normalized aggregatable options
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const options = normalizeAggregatable(optns)
 */
function normalizeAggregatable(optns) {
  // ensure options
  let { pathName, ref, aggregatable, isArray } = optns;

  // shape aggragatable options to follow 
  // mongodb $lookup options format
  const _from = ref ? _.toLower(inflection.pluralize(ref)) : ref;
  const _as = _.toLower(inflection.singularize(pathName));
  const lookup = ({
    from: _from,
    localField: pathName,
    foreignField: '_id',
    as: _as,
    unwind: {
      path: `$${_as}`,
      preserveNullAndEmptyArrays: true
    }
  });
  const unwind = _.merge({}, aggregatable.unwind);
  aggregatable = _.omit(aggregatable, 'unwind');
  aggregatable = _.merge({}, lookup, aggregatable, { unwind });

  // merge options
  let options = _.merge({}, { pathName, ref, isArray }, aggregatable);
  return options;
}


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
 * const aggregatables = collectAggregatables(schema);
 */
function collectAggregatables(schema) {
  // aggregatable map
  const aggregatables = {};

  // collect aggregatable schema paths
  eachPath(schema, function collectAggregatablePath(pathName, schemaType) {
    // obtain path schema type options
    const schemaTypeOptions = _.merge({},
      _.get(schemaType, 'caster.options'),
      _.get(schemaType, 'options')
    );

    // check if is array
    const isArray =
      (schemaType.$isMongooseArray || schemaType.instance === 'Array');
    schemaTypeOptions.isArray = isArray;

    // check if path is aggregatable
    const isAggregatable =
      (schemaTypeOptions && schemaTypeOptions.aggregatable);

    // if aggregatable collect
    if (isAggregatable) {
      // obtain aggregatable options
      const { ref, aggregatable, isArray } = schemaTypeOptions;
      const optns = _.merge({}, { pathName, ref, aggregatable, isArray });

      // collect aggregatable schema path
      aggregatables[pathName] = normalizeAggregatable(optns);
    }
  });

  // return collect aggregatable schema paths
  return aggregatables;
}


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
 * const aggregatable = require('@lykmapipo/mongoose-aggregatable');
 * const UserSchema = 
 * 	new Schema({ parent: { type: ObjectId, ref:'User', aggregatable:true } });
 * UserSchema.plugin(aggregatable);
 */
function aggregatable(schema /*, options*/ ) {
  // collect aggregatables schema paths
  const aggregatables = collectAggregatables(schema);
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
   * @private
   * const aggregation = User.lookup();
   */
  schema.statics.lookup = function lookup(criteria) {
    // ref
    const Model = this;

    // obtain aggregatable
    let aggregatables =
      _.filter(Model.AGGREGATABLE_FIELDS, function (aggregatable) {
        return !_.isEmpty(aggregatable.ref || aggregatable.from);
      });

    // ensure aggregatable collection name
    aggregatables =
      _.map(aggregatables, function (aggregatable) {
        const refModel = model(aggregatable.ref);
        if (refModel && refModel.collection) {
          const collectionName =
            (refModel.collection.name || aggregatable.from);
          aggregatable.from = collectionName;
        }
        return aggregatable;
      });

    //initialize aggregate query
    const aggregate = Model.aggregate();

    // pass match criteria
    if (criteria) {
      // cast criteria to actual types
      criteria = this.where(criteria).cast(this);

      // pass criteria to match aggregation stage
      aggregate.match(criteria);
    }

    // build aggregation based on aggregatables
    _.forEach(aggregatables, function (aggregatable) {
      // do lookup
      const lookupOptns = _.pick(aggregatable, LOOKUP_FIELDS);
      aggregate.lookup(lookupOptns);

      // do unwind
      const unwindOptns = aggregatable.unwind;
      aggregate.unwind(unwindOptns);
    });

    // return aggregate
    return aggregate;
  };
}


/* export aggregatable plugin */
module.exports = exports = aggregatable;