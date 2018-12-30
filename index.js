'use strict';


/* dependencies */
const _ = require('lodash');
const { eachPath } = require('@lykmapipo/mongoose-common');


/**
 * @function normalizeAggregatable
 * @name normalizeAggregatable
 * @description normalize aggragate options
 * @param {Object} optns aggregatable path schema options
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
  const lookup = ({ localField: pathName, foreignField: '_id', as: pathName });
  aggregatable = _.merge({}, lookup, aggregatable);

  // merge options
  let options = _.merge({}, { pathName, ref, isArray }, aggregatable);
  return options;
}


/**
 * @function collectAggregatables
 * @name collectAggregatables
 * @description collect schema aggregatable fields
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
  const aggregatabless = collectAggregatables(schema);
  schema.statics.AGGREGATABLE_FIELDS = aggregatabless;
}


/* export aggregatable plugin */
module.exports = exports = aggregatable;