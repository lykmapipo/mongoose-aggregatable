'use strict';

const _ = require('lodash');
const inflection = require('inflection');
const common = require('@lykmapipo/common');
const mongooseCommon = require('@lykmapipo/mongoose-common');

/**
 * @function isAggregatablePath
 * @name isAggregatablePath
 * @description check if schema path has aggregatable options
 * @param {object} schemaType valid mongoose schema type
 * @returns {boolean} whether schema path is aggregatable
 * @since 0.2.0
 * @version 0.1.0
 * @private
 * @example
 *
 * const isAggregatable = isAggregatablePath(schemaType)
 * //=> true
 */
const isAggregatablePath = (schemaType = {}) => {
  const options = mongooseCommon.schemaTypeOptionOf(schemaType);
  const canBeAggregated = options && options.aggregatable && options.ref;
  return canBeAggregated;
};

/**
 * @function normalize
 * @name normalize
 * @description normalize aggragate options
 * @param {object} optns aggregatable path options
 * @returns {object} normalized aggregatable options
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 *
 * const options = normalize(optns);
 * //=> { from: 'users', as: 'user', ...}
 */
const normalize = (optns) => {
  // pick options
  const { pathName, ref, aggregatable, isArray } = common.mergeObjects(optns);

  // normalize aggregatable
  const $aggregatable = common.mergeObjects({}, aggregatable);

  // normalize unwind
  const unwindPathName = isArray ? inflection.singularize(pathName) : pathName;
  const unwindDefaults = {
    path: `$${unwindPathName}`,
    preserveNullAndEmptyArrays: true,
  };
  const shouldUnwind = $aggregatable.unwind || !isArray;
  $aggregatable.unwind = shouldUnwind
    ? common.mergeObjects(unwindDefaults, $aggregatable.unwind)
    : undefined;

  // shape lookup options format as per mongodb specs
  let lookup = common.mergeObjects(
    {
      from: mongooseCommon.collectionNameOf(ref),
      as: shouldUnwind ? unwindPathName : pathName,
      localField: pathName,
      foreignField: '_id',
    },
    $aggregatable
  );
  lookup = common.mergeObjects({ pathName, ref, isArray }, lookup);

  // return lookup options
  return lookup;
};

/**
 * @function collectAggregatables
 * @name collectAggregatables
 * @description collect schema aggregatable paths/fields
 * @param {object} schema valid mongoose schema instance
 * @returns {object} hash of all schema aggregatable paths
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 *
 * const aggregatables = collectAggregatables(schema);
 * //=> { sister: { pathName: 'sister', ref: 'Person'}, ... }
 */
const collectAggregatables = (schema) => {
  // aggregatable map
  const aggregatables = {};

  /**
   * @function collectAggregatables
   * @name collectAggregatables
   * @description aggregatable path filter
   * @param {string} pathName path name
   * @param {object} schemaType SchemaType of a path
   */
  const collectAggregatablePath = (pathName, schemaType) => {
    // check if path is aggregatable
    const isAggregatable = isAggregatablePath(schemaType);

    // if aggregatable collect
    if (isAggregatable) {
      // obtain path schema type options
      const { ref, aggregatable } = mongooseCommon.schemaTypeOptionOf(schemaType);
      // check if is array
      const isArray = mongooseCommon.isArraySchemaType(schemaType);
      // obtain aggregatable options
      const optns = common.mergeObjects({ pathName, ref, aggregatable, isArray });
      // collect aggregatable schema path
      aggregatables[pathName] = normalize(optns);
    }
  };

  // collect aggregatable schema paths
  mongooseCommon.eachPath(schema, collectAggregatablePath);

  // return collect aggregatable schema paths
  return aggregatables;
};

/**
 * @function aggregatable
 * @name aggregatable
 * @description mongoose plugin to add aggregations behaviour.
 * @param {object} schema valid mongoose schema
 * @param {object} [optns] plugin options
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
 * const UserSchema = new Schema({
 *   parent: {
 *     type: ObjectId,
 *     ref:'User',
 *     aggregatable:true
 *    }
 *   });
 * UserSchema.plugin(aggregatable);
 *
 * ...
 *
 * User.lookup((error, users) => { ... });
 */
const aggregatable = (schema, optns) => {
  // ensure options
  const options = _.merge({}, { allowDiskUse: true }, optns);

  // collect aggregatables schema paths
  const aggregatables = collectAggregatables(schema);

  // remember aggregatable paths as model static
  // eslint-disable-next-line no-param-reassign
  schema.statics.AGGREGATABLE_FIELDS = aggregatables;

  // TODO add to Aggregate.prototype

  /**
   * @function lookup
   * @name lookup
   * @description Initialize aggregations on the model using aggregatable paths.
   * @param {object} criteria valid mongoose match criteria
   * @param {object} [opts] valid aggregation options
   * @param {object} [opts.exclude=[]] excluded aggregatable paths
   * from aggregation
   * @returns {object} mongoose aggregate instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.2.0
   * @public
   * @example
   *
   * const aggregation = User.lookup();
   */
  // eslint-disable-next-line no-param-reassign
  schema.statics.lookup = function lookup(criteria, opts = {}) {
    // ref curent model
    const Model = this;

    // ensure options
    const { exclude = [] } = common.mergeObjects(opts);

    // copy aggregatables
    let $aggregatables = common.mergeObjects({}, Model.AGGREGATABLE_FIELDS);

    // filter to allow only valid aggergatable
    const isValidAggregatable = ($aggregatable) => {
      const isAllowedPath = !(
        _.includes(exclude, $aggregatable.as) ||
        _.includes(exclude, $aggregatable.localField)
      );
      const hasRefAndFrom = !_.isEmpty($aggregatable.ref || $aggregatable.from);
      return isAllowedPath && hasRefAndFrom;
    };
    $aggregatables = _.filter($aggregatables, isValidAggregatable);

    // ensure aggregatable collection name(i.e from collection)
    const ensureFromCollection = ($aggregatable) => {
      // eslint-disable-next-line no-param-reassign
      $aggregatable.from = mongooseCommon.collectionNameOf($aggregatable.ref);
      return $aggregatable;
    };
    $aggregatables = _.map($aggregatables, ensureFromCollection);

    // initialize aggregate query
    const aggregate = Model.aggregate([]);

    // pass match criteria
    if (criteria) {
      // cast criteria to actual types
      const $criteria = this.where(criteria).cast(this);

      // pass criteria to match aggregation stage
      aggregate.match($criteria);
    }

    // build aggregation based on aggregatables
    const buildAggregation = ($aggregatable) => {
      // do lookup
      const lookupOptns = _.pick($aggregatable, mongooseCommon.LOOKUP_FIELDS);
      aggregate.lookup(lookupOptns);

      // do unwind
      if ($aggregatable.unwind) {
        aggregate.unwind($aggregatable.unwind);
      }
    };
    _.forEach($aggregatables, buildAggregation);

    // allow disk usage for aggregation
    const { allowDiskUse } = options;
    if (allowDiskUse) {
      aggregate.allowDiskUse(true);
    }

    // return aggregate
    return aggregate;
  };
};

module.exports = aggregatable;
