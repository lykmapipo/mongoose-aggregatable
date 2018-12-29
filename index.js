'use strict';


/* dependencies */
const _ = require('lodash');
const { eachPath } = require('@lykmapipo/mongoose-common');


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

    // check if path is aggregatable
    const isAggregatable =
      (schemaTypeOptions && schemaTypeOptions.aggregatable);

    // if aggregatable collect
    if (isAggregatable) {
      // console.log(pathName, schemaType);
      // obtain aggregatable options
      const aggregatableOptions =
        _.pick(schemaTypeOptions, 'ref', 'aggregatable');
      /*TODO {
       from: <collection to join>,model(options.ref).collection.name || options.from
       localField: <field from the input documents>,path
       foreignField: <field from the documents of the "from" collection>,_id
       as: <output array field>, path or options.path
     }*/
      // collect aggregatable schema path
      aggregatables[pathName] = _.merge({}, aggregatableOptions);
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