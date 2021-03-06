/**
 * Created by dleppik on 11/8/13.
 */

"use strict";

describe("RangeIntSet", function() {
    var RangeIntSet = ozone.intSet.RangeIntSet;

    var minMaxLengths = [ [0,0,1], [5,10,6], [-1,-1,0] ];
    var intSets = [];
    for (var i=0; i< minMaxLengths.length; i++) {
        var mml = minMaxLengths[i];
        intSets.push(new RangeIntSet(mml[0], mml[2]));
    }

    it("Reports min accurately", function() {
        for (var i=0; i<intSets.length; i++) {
            expect(intSets[i].min()).toBe(minMaxLengths[i][0]);
        }
    });
    it("Reports max accurately", function() {
        for (var i=0; i<intSets.length; i++) {
            expect(intSets[i].max()).toBe(minMaxLengths[i][1]);
        }
    });
    it("Reports size accurately", function() {
        for (var i=0; i<intSets.length; i++) {
            expect(intSets[i].size()).toBe(minMaxLengths[i][2]);
        }
    });

    it("Iterates with proper min, max, and length", function() {
        for (var i=0; i<intSets.length; i++) {
            var intSet = intSets[i];
            var mml = minMaxLengths[i];
            var iterator = intSet.iterator();
            var nonEmpty = mml[2] > 0;

            expect(iterator.hasNext()).toBe(nonEmpty);

            var first = iterator.next();
            var last = first;
            var count = 1;
            while(iterator.hasNext()) {
                last = iterator.next();
                count++;
            }
            if (nonEmpty) {
                expect(first).toBe(intSet.min());
                expect(last).toBe(intSet.max());
                expect(count).toBe(intSet.size());
            }
            else {
                expect(count).toBe(1);
                expect(last).toBeUndefined();
            }
        }
    });

    it("Iterates with proper skip behavior", function() {
        var it = new ozone.intSet.RangeIntSet(5, 6).iterator();
        it.skipTo(7);  expect(it.next()).toBe( 7);
        it.skipTo(8);  expect(it.next()).toBe( 8);
        it.skipTo(7);  expect(it.next()).toBe( 9);
        it.skipTo(10); expect(it.next()).toBe(10);
        it.skipTo(11); expect(it.next()).toBeUndefined();
    });


    it("Iterates via 'each' with proper min, max, and length", function() {
        for (var i=0; i<intSets.length; i++) {
            var intSet = intSets[i];
            var mml = minMaxLengths[i];
            var nonEmpty = mml[2] > 0;

            var first = "Not set";
            var last  = "Not set";
            var count = 0;
            var onFirst = true;
            intSet.each(function(item) {
                if (onFirst) {
                    first = item;
                    onFirst = false;
                }
                last = item;
                count++;
            });

            if (nonEmpty) {
                expect(first).toBe(intSet.min());
                expect(last).toBe(intSet.max());
                expect(count).toBe(intSet.size());
            }
            else {
                expect(first).toBe("Not set");
                expect(last).toBe("Not set");
                expect(count).toBe(0);
            }
        }
    });

    it("Unions with itself produce itself", function() {
        for (var i=0; i<intSets.length; i++) {
            var intSet = intSets[i];
            if (intSet.size() > 0) {
                expect(intSet.union(intSet)).toBe(intSet);
            }
        }
    });

    it("Unions with empty IntSet to produce itself", function() {
        for (var i=0; i<intSets.length; i++) {
            var intSet = intSets[i];
            expect(intSet.union(ozone.intSet.empty).equals(intSet)).toBe(true);
        }
    });

    it("Unions with intersecting RangeIntSets to produce RangeIntSets", function() {
        var a = RangeIntSet.fromTo(0, 9);
        var b = RangeIntSet.fromTo(1, 10);
        var aUnionB = a.union(b);
        expect(aUnionB).toEqual(b.union(a));
        expect(aUnionB instanceof RangeIntSet).toBe(true);
        expect(aUnionB.min()).toBe(0);
        expect(aUnionB.max()).toBe(10);

        a = RangeIntSet.fromTo(50, 60);
        b = RangeIntSet.fromTo(60, 70);
        aUnionB = a.union(b);
        expect(aUnionB).toEqual(b.union(a));
        expect(aUnionB instanceof RangeIntSet).toBe(true);
        expect(aUnionB.min()).toBe(50);
        expect(aUnionB.max()).toBe(70);

        a = RangeIntSet.fromTo( 99, 110);
        b = RangeIntSet.fromTo(100, 105);
        aUnionB = a.union(b);
        expect(aUnionB).toEqual(b.union(a));
        expect(aUnionB instanceof RangeIntSet).toBe(true);
        expect(aUnionB.min()).toBe(99);
        expect(aUnionB.max()).toBe(110);
    });

    it("Unions with non-intersecting RangeIntSets to produce a disjoint IntSet", function() {
        var a = RangeIntSet.fromTo(10, 20);
        var b = RangeIntSet.fromTo(21, 30);
        var aUnionB = a.union(b);

        expect(b.union(a).equals(aUnionB)).toBe(true);
        expect(aUnionB.size()).toBe(a.size() + b.size());
        expect(aUnionB.min()).toBe(a.min());
        expect(aUnionB.max()).toBe(b.max());
        aUnionB.each(function(num) {
            expect(a.has(num) || b.has(num)).toBe(true);
        });
    });

    it("Intersects with other RangeIntSets properly", function() {
        var a = RangeIntSet.fromTo(10, 20);
        var b = RangeIntSet.fromTo(21, 30);
        var aAndB = a.intersection(b);
        expect(aAndB.size()).toBe(0);

        var c = RangeIntSet.fromTo(15, 25);
        var expectedAAndC = RangeIntSet.fromTo(15, 20);
        expect(a.intersection(c).equals(expectedAAndC)).toBe(true);
        expect(c.intersection(a).equals(expectedAAndC)).toBe(true);
    });

    describe("intersectionOfUnions()", function() {
        it("Intersects (clips) non-intersecting RangeIntSets", function() {
            var toIntersect = RangeIntSet.fromTo(15, 25);
            var           a = RangeIntSet.fromTo(10, 20);
            var           b = RangeIntSet.fromTo(22, 30);
            var         iou = toIntersect.intersectionOfUnion([a, b]);
            var    expected = RangeIntSet.fromTo(15, 20).union(RangeIntSet.fromTo(22, 25));

            expect( iou.equals(expected) ).toBe( true );
        });
    });
});

describe("BitmapArrayIntSet tests", function() {
    it("Finds minValue and maxValue correctly", function() {

        // undefined
        var bitmap = new ozone.intSet.BitmapArrayIntSet(undefined, 0, 0);
        expect(bitmap.min()).toBe(-1);
        expect(bitmap.max()).toBe(-1);

        // []
        bitmap = new ozone.intSet.BitmapArrayIntSet([], 0, 0);
        expect(bitmap.min()).toBe(-1);
        expect(bitmap.max()).toBe(-1);

        // ["1"]
        bitmap = new ozone.intSet.BitmapArrayIntSet([1|0], 0, 1);

        expect(bitmap.min()).toBe(0);
        expect(bitmap.max()).toBe(0);

        // ["00000000000000000000000000000000" , "101"] or "10100000000000000000000000000000000"
        bitmap = new ozone.intSet.BitmapArrayIntSet([0|0, 5|0], 0, 3);

        expect(bitmap.min()).toBe(32);
        expect(bitmap.max()).toBe(34);

        // ["1000" , undefined, "101"] or "10100000000000000000000000000000000000000000000000000000000000000001000"
        bitmap = new ozone.intSet.BitmapArrayIntSet([8|0, undefined, 5|0], 0, 3);

        expect(bitmap.min()).toBe(3);
        expect(bitmap.max()).toBe(66);

        // ["101" , "00000000000000000000000000000000"] or "00000000000000000000000000000000101"
        bitmap = new ozone.intSet.BitmapArrayIntSet([5|0, 0|0], 0, 3);

        expect(bitmap.min()).toBe(0);
        expect(bitmap.max()).toBe(2);
    });

    it("Does has()", function() {
        // ["1"]
        var bitmap = new ozone.intSet.BitmapArrayIntSet([1|0], 0, 1);

        expect(bitmap.has( 0)).toBe(true);
        expect(bitmap.has( 1)).toBe(false);

        // ["111000" , , "101"] or "10100000000000000000000000000(32 zeroes)111000"
        bitmap = new ozone.intSet.BitmapArrayIntSet([56|0, undefined, 5|0], 0, 5);

        expect(bitmap.has( 0)).toBe(false);
        expect(bitmap.has( 1)).toBe(false);
        expect(bitmap.has( 3)).toBe(true);
        expect(bitmap.has( 31)).toBe(false);
        expect(bitmap.has( 40)).toBe(false);
        expect(bitmap.has( 63)).toBe(false);
        expect(bitmap.has( 64)).toBe(true);
        expect(bitmap.has( 65)).toBe(false);
        expect(bitmap.has( 66)).toBe(true);
        expect(bitmap.has( 200 )).toBe( false );
    });

    it("Implements offset correctly", function() {
        //  three words of zeroes, followed by "101"
        var bitmap = new ozone.intSet.BitmapArrayIntSet([5|0], 3, 2);

        expect(bitmap.min()).toBe(96);
        expect(bitmap.max()).toBe(98);

        expect(bitmap.has( 0)).toBe(false);
        expect(bitmap.has( 96)).toBe(true);
        expect(bitmap.has( 97)).toBe(false);

    });

    it("Creates an iterator", function() {
        // ["00000000000000000000000000000000" , "101"] or "10100000000000000000000000000000000"
        var bitmap = new ozone.intSet.BitmapArrayIntSet([0|0, 5|0], 0, 3);
        expect(bitmap.iterator() instanceof ozone.intSet.OrderedBitmapArrayIterator).toBe(true);
    });

    var bitmap1 = new ozone.intSet.BitmapArrayIntSet([1|0, 5|0], 0, 3);
    var bitmap2 = new ozone.intSet.BitmapArrayIntSet([6|0], 1, 2);
    var unionBitmap = new ozone.intSet.BitmapArrayIntSet([1|0, 7|0], 0, 4);
    var intersectionBitmap = new ozone.intSet.BitmapArrayIntSet([0|0, 4|0], 0, 1);

    it("intersects 2 bitmaps", function() {
        expect(bitmap1.intersection(bitmap2).equals(intersectionBitmap)).toBe(true);
    });

    it("unions 2 bitmaps", function() {
        expect(bitmap1.union(bitmap2).equals(unionBitmap)).toBe(true);
    });
});

describe("IntSets", function() {
    var RangeIntSet = ozone.intSet.RangeIntSet;
    var ArrayIterator = ozone.intSet.OrderedArrayIterator;
    var unionOfIterators = ozone.intSet.unionOfIterators;
    var intersectionOfOrderedIterators = ozone.intSet.intersectionOfOrderedIterators;

    // Many of these were generated randomly.  We need to test boundaries around 32 for packed bitmaps
    var arrays = [
        [],
        [0],
        [0, 1],
        [31],
        [33],
        [100],
        [100, 111],
        [ 2, 5, 8, 11, 15, 16, 18, 19, 21, 25, 29, 33, 37, 38, 39, 40, 43, 45, 48, 52 ],
        [ 0, 2, 5, 12, 18, 26, 36, 45, 51, 55, 64, 73, 74, 76, 84, 92, 98, 108, 118, 123 ],
        [ 2, 3, 4, 6, 7, 9, 10, 11, 12, 13, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 27, 29, 31, 33, 35, 36, 38, 40, 42, 44, 46, 47 ],
        [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32 ]
    ];

    var intSetFromArray = function(intSetClass, arrayOfIndexes) {
        var builder = intSetClass.builder();
        for (var i=0; i< arrayOfIndexes.length; i++) {
            builder.onItem(arrayOfIndexes[i]);
        }
        var result = builder.onEnd();
        expect(result.constructor).toBe(intSetClass);  // Precondition for all tests which use this
        return result;
    };

    var forEachArray = function(beforeElements, onEachElement, afterElements) {
        for (var i=0; i< arrays.length; i++) {
            var array = arrays[i];
            if (typeof beforeElements === "function") {
                beforeElements(array);
            }
            if (typeof(onEachElement) === "function") {
                for (var j=0; j<array.length; j++) {
                    onEachElement(array, array[j]);
                }
            }
            if (typeof afterElements === "function") {
                afterElements(array);
            }
        }
    };

    var intSetForEachArray = function(intSetClass, withArrayAndIntSet) {
        var builder = null;
        forEachArray(
            function(array)          { builder = intSetClass.builder();            },  // Before iterating
            function(array, element) { builder.onItem(element);                    },  // For each item in the array
            function(array)          { withArrayAndIntSet(array, builder.onEnd()); }   // After iterating
        );
    };

    describe("Binary search", function() {
        it("Finds each element, and only those elements", function() {
            forEachArray(function(array) {
                var element = 0;
                for (var arrayIndex=0; arrayIndex<array.length; arrayIndex++) {
                    var nextInArray = array[arrayIndex];
                    for (; element < nextInArray; element++) {
                        expect(ozone.intSet.search(element, array, 0, array.length-1)).toEqual(~arrayIndex);
                    }
                    expect(ozone.intSet.search(element, array, 0, array.length-1)).toEqual(arrayIndex);
                    element++;
                }
            });
        });
    });

    var sharedBehaviorForIntSetClasses = function(intSetClass, intSetClassName) {
        describe("(IntSet shared behavior)", function() {
            it("Has a builder that produces something of the right size", function () {
                var builder;
                forEachArray(
                    function () {
                        builder = intSetClass.builder();
                        expect(typeof(builder)).toBe("object");
                    },
                    function (a, element) {
                        builder.onItem(element);
                    },
                    function (array) {
                        expect(builder.onEnd().size()).toEqual(array.length);
                    }
                );
            });
            it("Reports min accurately", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    var expected = (array.length == 0) ? -1 : array[0];
                    var actual = intSet.min();
                    expect(actual).toEqual(expected);
                });
            });
            it("Reports max accurately", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    var expected = (array.length == 0) ? -1 : array[array.length - 1];
                    expect(intSet.max()).toEqual(expected);
                });
            });
            it("Reports 'has' accurately", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    var element = 0;
                    for (var arrayIndex = 0; arrayIndex < array.length; arrayIndex++) {
                        var nextInArray = array[arrayIndex];
                        for (; element < nextInArray; element++) {
                            expect(intSet.has(element)).toEqual(false);
                        }
                        expect(intSet.has(element)).toEqual(true);
                        element++;
                    }
                    for (; element < nextInArray + 33; element++) {  // Check past next packed bits
                        expect(intSet.has(element)).toEqual(false);
                    }
                });
            });
            describe("Iterator", function () {
                it("Increases monotonically", function () {
                    intSetForEachArray(intSetClass, function (array, intSet) {
                        var it = intSet.iterator();
                        var previous = -1;
                        while (it.hasNext()) {
                            var element = it.next();
                            expect(element).toBeGreaterThan(previous);
                            previous = element;
                        }
                    });
                });
                it("Matches has", function () {
                    intSetForEachArray(intSetClass, function (array, intSet) {
                        var it = intSet.iterator();
                        while (it.hasNext()) {
                            var element = it.next();
                            var result = intSet.has(element);
                            if ( ! result) {
                                console.log("element " + element + " has = " + result);
                            }
                            expect(result).toBe(true);
                        }
                    });
                });
                it("Matches size", function () {
                    intSetForEachArray(intSetClass, function (array, intSet) {
                        var it = intSet.iterator();
                        var count = 0;
                        while (it.hasNext()) {
                            it.next();
                            count++;
                        }
                        expect(count).toBe(intSet.size());
                    });
                });

                describe("skip()", function() {
                    it("does nothing when less than or equal to min", function() {
                        intSetForEachArray(intSetClass, function (array, intSet) {
                            var it = intSet.iterator();
                            it.skipTo(intSet.min() - 1);
                            it.skipTo(intSet.min() - 2);
                            it.skipTo(intSet.min() - 3);
                            if (intSet.size() > 0) {
                                expect(it.hasNext()).toBe(true);
                                expect(it.next()).toBe(intSet.min());
                            }
                            else {
                                expect(it.hasNext()).toBe(false);
                            }

                            var min = (intSet.size() === 0) ?  0  : intSet.min();
                            it = intSet.iterator();
                            it.skipTo(min);
                            it.skipTo(min);
                            it.skipTo(min);
                            if (intSet.size() > 0) {
                                expect(it.hasNext()).toBe(true);
                                expect(it.next()).toBe(intSet.min());
                            }
                            else {
                                expect(it.hasNext()).toBe(false);
                            }
                        });
                    });
                    it("skips ahead, but skipping back does nothing", function() {
                        intSetForEachArray(intSetClass, function (array, intSet) {
                            if (array.length > 1) {
                                var it = intSet.iterator();
                                var skipTo = intSet.max() - 1;
                                it.skipTo(skipTo);
                                var expectedNext = (intSet.has(skipTo)) ? skipTo : intSet.max();
                                expect(it.next()).toBe(expectedNext);
                            }
                            if (array.length > 2) {

                                // Try skipping to existing entries

                                for (var i=1; i<array.length; i++) {
                                    var previous = array[i-1];
                                    var current = array[i];

                                    it = intSet.iterator();
                                    it.skipTo(current);   // Skip ahead
                                    it.skipTo(previous);  // Do nothing
                                    expect(it.hasNext()).toBe(true);
                                    expect(it.next()).toBe(current);
                                }

                                // Try skipping to non-entries

                                for (i=1; i<array.length; i++) {
                                    previous = array[i-1];
                                    current = array[i];

                                    it = intSet.iterator();
                                    it.skipTo( (current+previous)/2 );   // Skip ahead to something between entries
                                    it.skipTo(previous);  // Do nothing
                                    expect(it.hasNext()).toBe(true);
                                    expect(it.next()).toBe(current);
                                }
                            }
                        });
                    });
                    it("can skip beyond end, and subsequent calls to skipTo() and hasNext() do nothing", function() {
                        intSetForEachArray(intSetClass, function (array, intSet) {
                            if (array.length > 0) {  // so min and max are well-behaved
                                it = intSet.iterator();
                                for (var i=0; i<3; i++) {
                                    it.skipTo(intSet.max() + 1);
                                    expect(it.hasNext()).toBe(false);
                                }
                            }
                        });
                    });
                });
            });

            it("Has 'each' which matches the iterator", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    var it = intSet.iterator();
                    intSet.each(function (element) {
                        var itElement = it.next();
                        expect(element).toBe(itElement);
                    });
                    expect(it.hasNext()).toBe(false);
                });
            });

            it("Unions with a RangeIntSet with the same or wider range to produce a RangeIntSet", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    var sameSize = RangeIntSet.fromTo(intSet.min(), intSet.max());
                    var sameSizeUnion = intSet.union(sameSize);
                    if (!sameSizeUnion.equals(sameSize)) {
                        console.log("sameSizeUnion min: " + sameSizeUnion.min() + ", max: " + sameSizeUnion.max() +
                            ", size: " + sameSizeUnion.size() + ", equality: " + sameSizeUnion.equals(sameSize));
                    }
                    expect(sameSizeUnion.equals(sameSize)).toBe(true);
                    expect(sameSizeUnion instanceof RangeIntSet).toBe(true);

                    var bigger = RangeIntSet.fromTo(0, intSet.max() + 1);
                    var biggerUnion = intSet.union(bigger);
                    expect(biggerUnion.equals(bigger)).toBe(true);
                    expect(biggerUnion instanceof RangeIntSet).toBe(true);
                });
            });

            it("Unions with a partially overlapping or smaller RangeIntSet properly", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    if (array.length === 0) {
                        return;
                    }
                    var r1 = RangeIntSet.fromTo(0, intSet.min());
                    expect(intSet.union(r1).equals(unionOfIterators(r1.iterator(), intSet.iterator()))).toBe(true);

                    var r2 = RangeIntSet.fromTo(intSet.max(), intSet.max() + 2);
                    expect(intSet.union(r2).equals(unionOfIterators(r2.iterator(), intSet.iterator()))).toBe(true);

                    if (intSet.size() > 1) {
                        var r3 = RangeIntSet.fromTo(intSet.min() + 1, intSet.max());
                        expect(intSet.union(r3).equals(unionOfIterators(r3.iterator(), intSet.iterator()))).toBe(true);
                    }
                    if (intSet.size() > 2) {
                        var r4 = RangeIntSet.fromTo(intSet.min() + 1, intSet.max() - 1);
                        expect(intSet.union(r4).equals(unionOfIterators(r4.iterator(), intSet.iterator()))).toBe(true);
                    }
                });
            });

            it("Intersects with a RangeIntSet with the same or wider range to produce itself or an equivalent intSet", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    if (array.length === 0) {
                        return;
                    }
                    var r1 = RangeIntSet.fromTo(intSet.min(), intSet.max());
                    expect(intSet.intersection(r1).equals(intersectionOfOrderedIterators(r1.iterator(), intSet.iterator()))).toBe(true);

                    var r2 = RangeIntSet.fromTo(0, intSet.max() + 1);
                    expect(intSet.intersection(r2).equals(intersectionOfOrderedIterators(r2.iterator(), intSet.iterator()))).toBe(true);

                });
            });

            it("Intersects with a partially overlapping or smaller RangeIntSet to produce a truncated subset", function () {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    if (array.length === 0) {
                        return;
                    }
                    var r1 = RangeIntSet.fromTo(0, intSet.min());
                    expect(intSet.intersection(r1).equals(intersectionOfOrderedIterators(r1.iterator(), intSet.iterator()))).toBe(true);

                    var r2 = RangeIntSet.fromTo(intSet.max(), intSet.max() + 2);
                    expect(intSet.intersection(r2).equals(intersectionOfOrderedIterators(r2.iterator(), intSet.iterator()))).toBe(true);

                    if (intSet.size() > 1) {
                        var r3 = RangeIntSet.fromTo(intSet.min() + 1, intSet.max());
                        expect(intSet.intersection(r3).equals(intersectionOfOrderedIterators(r3.iterator(), intSet.iterator()))).toBe(true);
                    }
                    if (intSet.size() > 2) {
                        var r4 = RangeIntSet.fromTo(intSet.min() + 1, intSet.max() - 1);
                        expect(intSet.intersection(r4).equals(intersectionOfOrderedIterators(r4.iterator(), intSet.iterator()))).toBe(true);
                    }
                });
            });

            it("Does a trivial union properly", function () {  // Less trivial cases are handled below
                var a1 = [    30,  50,     90 ];
                var a2 = [ 20,     50, 80     ];
                var au = [ 20, 30, 50, 80, 90 ];

                var set1 = intSetFromArray(intSetClass, a1);
                var set2 = intSetFromArray(intSetClass, a2);

                expect(set1.union( set2 ).size()).toEqual(  5 );  // Hard coded, to keep other bugs from hiding failure
                expect(set1.union( set2 ).min() ).toEqual( 20 );
                expect(set1.union( set2 ).max() ).toEqual( 90 );
                expect(set1.union( set2 ).equals( intSetFromArray(intSetClass, au) )).toBe(true);
                expect(set2.union( set1 ).equals( intSetFromArray(intSetClass, au) )).toBe(true);

            });


            it("Does a trivial intersection properly", function () {  // Less trivial cases are handled below
                var a1 = [     30, 50, 80, 90 ];
                var a2 = [ 20,     50, 80     ];
                var ai = [         50, 80     ];

                var set1 = intSetFromArray(intSetClass, a1);
                var set2 = intSetFromArray(intSetClass, a2);

                expect(set1.intersection(set2).size()).toEqual(  2 );  // Hard coded, to keep other bugs from hiding failure
                expect(set1.intersection(set2).min() ).toEqual( 50 );
                expect(set1.intersection(set2).max() ).toEqual( 80 );
                expect(set1.intersection(set2).equals( intSetFromArray(intSetClass, ai) )).toBe(true);
                expect(set2.intersection(set1).equals( intSetFromArray(intSetClass, ai) )).toBe(true);
            });

            it("returns itself on a blank intersectionOfUnion", function() {
                intSetForEachArray(intSetClass, function (array, intSet) {
                    expect( intSet.intersectionOfUnion([]).equals(intSet) ).toBe(true);
                });
            });

            it("does a simple intersectionOfUnion properly", function() {
                var a1 = [     30,     50,         90 ];
                var a2 = [ 20,         50,     80     ];
                var  b = [     30, 40, 50, 70, 80     ];
                var ba = [     30,     50,     80     ];

                var setA1 = intSetFromArray(intSetClass, a1);
                var setA2 = intSetFromArray(intSetClass, a2);
                var  setB = intSetFromArray(intSetClass,  b);
                var setBa = intSetFromArray(intSetClass, ba);

                var         result = setB.intersectionOfUnion([setA1, setA2]);
                var expectedString = ozone.intSet.asString(setBa);
                var   resultString = ozone.intSet.asString(result);

                expect( resultString ).toEqual( expectedString );  // Easier to debug, otherwise same as the line below
                expect( result.equals(setBa) ).toBe( true );       // What we're actually verifying
            });
        });
    };

    var behaviorAcrossIntSetClasses = function(intSetClass0, intSetClassName0, intSetClass1, intSetClassName1) {
        describe("Operations on "+intSetClassName0+" with "+intSetClassName1, function() {

            it("intersect() is equivalent to ozone.intSet.intersectionOfOrderedIterators()", function() {
                intSetForEachArray(intSetClass0, function(array0, intSet0) {
                    for (var index1=0; index1< arrays.length; index1++) {
                        var array1 = arrays[index1];
                        var intSet1 = intSetFromArray(intSetClass1, array1);

                        var expected = intersectionOfOrderedIterators(intSet0.iterator(), intSet1.iterator());
                        expect(  intSet0.intersection(intSet1).equals(expected)  ).toBe(true);
                    }
                });
            });

            it("union() is equivalent to ozone.intSet.unionOfIterators()", function() {
                intSetForEachArray(intSetClass0, function(array0, intSet0) {
                    for (var index1 = 0; index1 < arrays.length; index1++) {
                        var array1 = arrays[index1];
                        var intSet1 = intSetFromArray(intSetClass1, array1);

                        var expected = unionOfIterators(intSet0.iterator(), intSet1.iterator());
                        var actual = intSet0.union(intSet1);
                        expect(actual.equals(expected)).toBe(true);
                    }
                });
            });

            describe("intersectionOfUnions()", function() {
                it("treats a union of "+intSetClassName1+" the same as a union of "+intSetClassName0, function() {
                    intSetForEachArray(intSetClass0, function(array0, intSet0) {
                        for (var startIndex=0; startIndex < arrays.length; startIndex++) {
                            var toUnion0 = [];
                            var toUnion1 = [];
                            for (var i=startIndex; i < arrays.length  && i < startIndex+5; i++) {
                                var arrayToUnion = arrays[i];
                                toUnion0.push(intSetFromArray(intSetClass0, arrayToUnion));
                                toUnion1.push(intSetFromArray(intSetClass1, arrayToUnion));
                            }
                            var result0 = intSet0.intersectionOfUnion(toUnion0);
                            var result1 = intSet0.intersectionOfUnion(toUnion1);

                            var resultString0 = ozone.intSet.asString(result0);
                            var resultString1 = ozone.intSet.asString(result1);

                            expect(resultString0).toEqual(resultString1); // Easier to debug, otherwise same as the line below
                            expect(result0.equals(result1)).toBe(true);   // What we're actually verifying
                        }
                    });
                });

                it("treats a union mixing "+intSetClassName0+" and "+intSetClassName1+" the same as a union of "+intSetClassName0, function() {
                    intSetForEachArray(intSetClass0, function(array0, intSet0) {
                        for (var startIndex=0; startIndex < arrays.length; startIndex++) {
                            var     toUnion0 = [];
                            var toUnionMixed = [];
                            for (var i=startIndex; i < arrays.length  && i < startIndex+5; i++) {
                                var arrayToUnion = arrays[i];
                                toUnion0.push(intSetFromArray(intSetClass0, arrayToUnion));
                                var classToUse = (i%2) ? intSetClass0 : intSetClass1;
                                toUnionMixed.push(intSetFromArray(classToUse, arrayToUnion));
                            }
                            var result0 = intSet0.intersectionOfUnion(toUnion0);
                            var result1 = intSet0.intersectionOfUnion(toUnionMixed);

                            var resultString0 = ozone.intSet.asString(result0);
                            var resultString1 = ozone.intSet.asString(result1);

                            expect(resultString0).toEqual(resultString1); // Easier to debug, otherwise same as the line below
                            expect(result0.equals(result1)).toBe(true);   // What we're actually verifying
                        }
                    });
                });

            });
        });
    };

    describe("ArrayIndexBitSet", function() {
        sharedBehaviorForIntSetClasses(ozone.intSet.ArrayIndexIntSet, "ArrayIndexIntSet");
    });

    describe("BitmapArrayIntSet", function() {
        sharedBehaviorForIntSetClasses(ozone.intSet.BitmapArrayIntSet, "BitmapArrayIntSet");

        behaviorAcrossIntSetClasses(
            ozone.intSet.ArrayIndexIntSet, "ArrayIndexIntSet",
            ozone.intSet.BitmapArrayIntSet, "BitmapArrayIntSet");

        behaviorAcrossIntSetClasses(
            ozone.intSet.BitmapArrayIntSet, "BitmapArrayIntSet",
            ozone.intSet.ArrayIndexIntSet, "ArrayIndexIntSet");

    });

    describe("ArleIntSet", function() {

        var setFromArray = function(base, arrayOfIndexes) {
            var builder = ozone.intSet.ArleIntSet.builderWithBase(base, 10);
            arrayOfIndexes.forEach(function(item) { builder.onItem(item) });
            var result = builder.onEnd();

            expect(result.size()).toBe(arrayOfIndexes.length);
            if (arrayOfIndexes.length > 0) {
                expect(result.min()).toBe(arrayOfIndexes[0]);
                expect(result.max()).toBe(arrayOfIndexes[arrayOfIndexes.length-1]);
            }
            var iterator = result.iterator();
            arrayOfIndexes.forEach(function(item) {
                expect(iterator.hasNext()).toBe(true);
                var next = iterator.next();
                expect(next).toBe(item);
            });

            return result;
        };

        it("Builds base-10", function() {
            expect(setFromArray(10,           []).data).toBe("");
            expect(setFromArray(10,    [3, 4, 6]).data).toBe("3211");
            expect(setFromArray(10,    [1, 2, 3]).data).toBe("13");
            expect(setFromArray(10, [0, 3, 4, 5]).data).toBe("0123");
            expect(setFromArray(10, [0, 3, 5, 7]).data).toBe("01211111");
            expect(setFromArray(10, [0, 1, 100, 105]).data).toBe("02(98)141");
            expect(setFromArray(10, [101,102,103,104,105,106,107,108,109,110,111,112]).data).toBe("(101)(12)");
        });

        sharedBehaviorForIntSetClasses(ozone.intSet.ArleIntSet, "ArleIntSet");

        behaviorAcrossIntSetClasses(
            ozone.intSet.ArrayIndexIntSet, "ArleIntSet",
            ozone.intSet.BitmapArrayIntSet, "BitmapArrayIntSet");

        behaviorAcrossIntSetClasses(
            ozone.intSet.BitmapArrayIntSet, "ArleIntSet",
            ozone.intSet.ArrayIndexIntSet, "ArrayIndexIntSet");
    });

    describe("SimpleOrderedIterator", function() {
        it("Iterates properly", function() {
            intSetForEachArray(ozone.intSet.ArrayIndexIntSet, function(array, intSet) {
                var iterator = new ozone.intSet.SimpleOrderedIterator(intSet.iterator());
                array.forEach(function(item) {
                    expect(iterator.hasNext()).toBe(true);
                    expect(iterator.next()).toBe(item);
                });
                expect(iterator.hasNext()).toBe(false);
            });
        });
        it("Seeks properly", function() {
            intSetForEachArray(ozone.intSet.ArrayIndexIntSet, function(array, intSet) {
                array.forEach(function(item) {
                    var iterator = new ozone.intSet.SimpleOrderedIterator(intSet.iterator());
                    iterator.skipTo(item);
                    expect(iterator.hasNext()).toBe(true);
                    var nextItem = iterator.next();
                    expect(nextItem).toBe(item);
                });
            });
        });
    });
});