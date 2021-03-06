/**
 * Copyright 2013-2014 by Vocal Laboratories, Inc. Distributed under the Apache License 2.0.
 */
/// <reference path='../_all.ts' />

module ozone.columnStore {

    /**
     * A Field which is inefficient for filtering;  intended for columns where distinctValueEstimate is so large that
     * an IndexedField would use an unreasonable amount of memory. Stores the entire column in a single dense array.
     */
    export class UnIndexedField<T> implements UnaryField<T>, RandomAccessField<T> {

        /**
         * Returns a reducer that can be run on a source DataStore to reproduce a sourceField.
         *
         * @param sourceField  the field which will be replicated
         * @param params       may override any FieldDescribing field, plus additional parameters:
         *                     nullValues   -- if provided, this is a list of values equivalent to null.
         *                     nullProxy    -- if provided, this is used instead of null for storing null values.  This
         *                                     may allow the JavaScript implementation to use an array of primitives.
         *                                     (Haven't yet checked to see if any JS implementations actually do this.)
         */
        public static builder<T>(sourceField : UnaryField<T>, params : any = {} ) : Reducer<IndexedRowToken,UnIndexedField<T>> {
            var array : T[] = [];
            var offset = 0;
            var nullValues = (typeof(params["nullValues"]) === "object" )  ?  params["nullValues"] : [];
            var nullProxy = (typeof(params["nullProxy"]) === "undefined")  ?  null : params["nullProxy"];
            var nullMap = {};
            for (var i=0; i<nullValues.length; i++) {
                var nv = nullValues[i];
                nullMap[""+nv] = nv;
            }

            var descriptor : FieldDescribing = mergeFieldDescriptors(sourceField, params);


            return {
                onItem: function(indexedRowToken : IndexedRowToken) {
                    var value : T = ozone.convert(sourceField.value(indexedRowToken.rowToken), descriptor);
                    if (nullValues.length > 0  &&  nullMap[""+value] === value) {
                        value = nullProxy;
                    }

                    if (array.length === 0) {
                        if (value !== null) {
                            array[0] = value;
                            offset = indexedRowToken.index;
                        }
                    }
                    else {
                        var newIndex = indexedRowToken.index-offset;
                        while (array.length < newIndex) {
                            array.push(nullProxy);
                        }
                        array[newIndex] = value;
                    }
                },
                onEnd: function() : UnIndexedField<T> {
                    while ((array.length > 0)  &&  (array[array.length-1] === nullProxy)) {
                        array.pop();  // Trim the end
                    }
                    return new UnIndexedField(descriptor, array, offset, nullProxy);
                }
            };
        }

        constructor( descriptor : FieldDescribing,
                     private array : T[],
                     private offset : number = 0,
                     private nullProxy : any = null )
        {
            this.identifier      = descriptor.identifier;
            this.displayName     = descriptor.displayName;
            this.typeOfValue     = descriptor.typeOfValue;
            this.typeConstructor = descriptor.typeConstructor;
            this.valueEstimate   = descriptor.distinctValueEstimate();
            this.aggregationRule = (descriptor.aggregationRule) ? descriptor.aggregationRule : null;

            var range : Range = descriptor.range();
            if (typeof range === 'undefined' || descriptor.typeOfValue !== 'number') {
                range = null;
            }
            this.rangeValue = range;

            if (typeof(this.valueEstimate) !== "number" || isNaN(this.valueEstimate) || this.valueEstimate > array.length) {
                this.valueEstimate = array.length;
            }

            if (array.length > 0  &&  (array[0] === nullProxy  || array[array.length-1] === nullProxy) ) {
                throw new Error("Array must be trimmed (Field: "+this.identifier+")");
            }
        }

        identifier      : string;
        displayName     : string;
        typeOfValue     : string;
        typeConstructor : any;
        aggregationRule : string;

        private valueEstimate : number;
        private    rangeValue : ozone.Range;

        value(rowToken):T {
            var index = (<number> rowToken)-this.offset;
            var result : T = this.array[index];
            return (this.isNull(result))  ?  null  :  result;
        }

        private isNull(item : T) : boolean {
            return (typeof(item) === null || typeof(item) === 'undefined' || item === this.nullProxy);
        }

        values(rowToken):T[] {
            var result = this.value(rowToken);
            return (result === null)  ?  []  : [result];
        }

        range():ozone.Range {
            return this.rangeValue;
        }

        distinctValueEstimate():number {
            return this.valueEstimate;
        }

        rowHasValue(rowToken : number, value : any) : boolean {
            var actualValue = this.value(rowToken);
            return actualValue === value;
        }

        /** Returns the first rowToken;  this is for serialization and not intended for queries. */
        firstRowToken() : number {
            return this.offset;
        }

        /** Returns a copy of the data array for serialization; not intended for queries. */
        dataArray() : any[] {
            return this.array.concat();
        }
    }
}