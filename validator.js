"use strict";
// IMDF-validator volgens OGC 20-094 (IMDF 1.0.0).
// Regelnamen, ernst en definities komen letterlijk uit de officiële lijst imdf-validations-1.0.3.csv
// (https://docs.ogc.org/cs/20-094/imdf-validations-1.0.3.csv). Er worden alleen regels gemeld die in die lijst staan.
// Regels die een geometrische vergelijking tussen vlakken vereisen (overlap, "covered by", gelijkheid van
// vlak-unies) worden NIET gecontroleerd en staan in het rapport als "niet gecontroleerd".

const IMDF_RULES = [
["N/A", "Info", "ZeroCountOfUnitQualifiedAddresses", "Validates that a delivery has at least one unit-qualified Address."],
["N/A", "Violation", "FeatureIdMustBeString", "Structural Validation: Validates that the feature id is a string. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureIdMustBeUnique", "Structural Validation: Validates that a feature has a unique ID. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureIdMustNotBeEmpty", "Structural Validation: Validates that the feature id is not an empty string. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureMustHaveFeatureType", "Structural Validation: Validates that the feature has a top-level feature_type field. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureMustHaveId", "Structural Validation: Validates that the feature has a top-level id field. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureTypeMustBeString", "Structural Validation: Validates that the feature type is a string. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FeatureTypeMustNotBeEmpty", "Structural Validation: Validates that the feature has a non-empty feature type. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FileMustBeValidGeoJSON", "Structural Validation: Validates that a file is a valid GeoJSON. Checks include, amongst others: i) Self-intersection, where a line segment crosses a line segment. ii) Self-intersection, where a line segment overlaps a line segment. iii) Self-intersection, where vertices have the same x/y coordinates. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "FileMustContainFeatureCollection", "Structural Validation: Validates that the file contains a valid GeoJSON FeatureCollection. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "ManifestFileMustBePresent", "Structural Validation: Validates that a Manifest file is present in the delivery. Complete validation of an Archive is predicated upon all structural validations being passed."],
["N/A", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["N/A", "Violation", "ReferencedFeatureIDMustBeResolvable", "Structural Validation: Validates that a feature id reference is resolvable."],
["N/A", "Violation", "VenueCountMustBeExactlyOne", "Validates that a delivery contains only one Venue feature."],
["Address", "Violation", "AddressMustBeReferenced", "Validates that an Address record is referenced by a feature."],
["Address", "Violation", "AddressMustHaveAddressLine", "Validates that an Address has an address line."],
["Address", "Violation", "AddressMustHaveCountryCode", "Validates that an Address has a country code."],
["Address", "Violation", "AddressMustHaveLocality", "Validates that an Address has a locality."],
["Address", "Violation", "AddressMustHaveProvinceCode", "Validates that an Address has a Province code when defined by ISO for Country."],
["Address", "Violation", "AddressUnitMustNotBeBlank", "Validates that Address Unit is not blank. (Not empty string or whitespace.)"],
["Address", "Violation", "InvalidCountryCode", "Validates that a country code is a valid ISO-3166 value."],
["Address", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Address", "Violation", "InvalidISOCountryAndISOProvinceCodeCombination", "Validates that the ISO Province code is valid for ISO the Country."],
["Address", "Violation", "InvalidIsoProvinceCode", "Validates that a province code is a valid ISO-3166-2 value."],
["Address", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Address", "Violation", "PostalCodeExtensionMustNotBeBlank", "Validates that postal_code_ext in Address is not blank. (Not empty string or whitespace.)"],
["Address", "Violation", "PostalCodeMustNotBeBlank", "Validates that postal_code in an Address is not blank. (Not empty string or whitespace.)"],
["Address", "Violation", "VanityPostalCodeMustNotBeBlank", "Validates that postal_code_vanity in Address is not blank. (Not empty string or whitespace.)"],
["Address", "Warning", "AddressHasDissimilarProvinceCode", "Validates that Addresses do not have dissimilar province codes."],
["Address", "Warning", "AddressMustBeDistinct", "Validates that Addresses are distinct."],
["Address", "Warning", "AddressShouldHavePostalCode", "Validates that an Address has a postal_code."],
["Amenity", "Info", "GenericRestroomUnitCategoryContainsSpecificRestroomAmenityCategory", "Validates that a 'restroom.family', 'restroom.female', 'restroom.male', 'restroom.transgender', or 'restroom.unisex' Amenity is not contained (or touched) by a 'restroom' Unit."],
["Amenity", "Violation", "AccessibilityMustBeValid", "Validates the accessibility category assigned to the feature."],
["Amenity", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Amenity", "Violation", "AmenityCategoryMustBeValid", "Validates the category assigned to an Amenity."],
["Amenity", "Violation", "AmenityMustHaveCategory", "Validates that an Amenity has a category value."],
["Amenity", "Violation", "AmenityMustHavePointGeometry", "Validates that an Amenity is a Point geometry."],
["Amenity", "Violation", "AmenityMustReferenceUnit", "Validates that an Amenity references a Unit."],
["Amenity", "Violation", "CorrelationIdMustBeMatched", "Validates that a correlation_id is matched by at least one other feature's correlation_id in the same feature-type."],
["Amenity", "Violation", "HoursMustNotBeBlank", "Validates that hours are not blank. (Not empty string or whitespace.)"],
["Amenity", "Violation", "InvalidCorrelationID", "Validates that a 'correlation_id' is a valid v4 UUID value."],
["Amenity", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Amenity", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Amenity", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Amenity", "Violation", "LevelIDsMustBeDissimilarForCorrelationID", "Validates that features from the same feature-type, whose correlation_id match, possess dissimilar Level id values."],
["Amenity", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Amenity", "Violation", "PhoneMustBeValid", "Validates that the phone is correctly formatted."],
["Amenity", "Violation", "WebsiteMustBeValid", "Validates that a website URL is correctly formatted."],
["Amenity", "Warning", "AircraftBoardingGateAmenityShouldHaveName", "Validates that a 'boardinggate.aircraft' Amenity possesses a name."],
["Amenity", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Amenity", "Warning", "AmenityNameAndCategoryAreSame", "Validates that an Amenity does not possess a category that matches the name."],
["Amenity", "Warning", "AmenityNameShouldNotBeDuplicate", "Validates that names among Amenities with the same category ('arrivalgate', 'boardinggate.aircraft', 'boardinggate.bus' and 'boardinggate.train') are distinct."],
["Amenity", "Warning", "AmenityShouldBeCoveredByReferencedUnit", "Validates that an Amenity is covered by the referenced Unit."],
["Amenity", "Warning", "AmenityShouldNotEqualAmenity", "Validates that Amenities are not coincident on the same Level."],
["Amenity", "Warning", "ArrivalGateAmenityShouldHaveName", "Validates that an 'arrivalgate' Amenity possesses a name."],
["Amenity", "Warning", "BaggageCarouselAmenityNameIsDuplicateInSameBuilding", "Validates that 'baggagecarousel' Amenity names are distinct in the same Building."],
["Amenity", "Warning", "BaggageCarouselAmenityShouldHaveName", "Validates that a 'baggagecarousel' Amenity possesses a name."],
["Amenity", "Warning", "BusBoardingGateAmenityShouldHaveName", "Validates that a 'boardinggate.bus' Amenity possesses a name."],
["Amenity", "Warning", "CategoryShouldBeSameForCorrelationID", "Validates that features with matching correlation_id possess the same category."],
["Amenity", "Warning", "ElevatorUnitMayOnlyContainElevatorAmenity", "Validates that an Amenity, if present and contained (or touched) by an 'elevator' Unit, is an 'elevator' Amenity and not any other category of Amenity."],
["Amenity", "Warning", "EscalatorUnitMayOnlyContainEscalatorAmenity", "Validates that an Amenity, if present and contained (or touched) by an 'escalator' Unit, is an 'escalator' Amenity and not any other category of Amenity."],
["Amenity", "Warning", "FemaleRestroomUnitMustNotContainRestroomAmenityCategory", "Validates that a 'restroom.family', 'restroom.male', 'restroom.transgender' or 'restroom.unisex' Amenity is not contained (or touched) by a 'restroom.female' Unit."],
["Amenity", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Amenity", "Warning", "KioskMustNotContainAmenityCategory", "Validates that an 'elevator', 'escalator', 'movingwalkway' or 'stairs' Amenity is not contained (or touched) by a Kiosk."],
["Amenity", "Warning", "MaleRestroomUnitMustNotContainRestroomAmenityCategory", "Validates that a 'restroom.family', 'restroom.female', 'restroom.transgender' or 'restroom.unisex' Amenity is not contained (or touched) by a 'restroom.male' Unit."],
["Amenity", "Warning", "MovingWalkwayUnitMayOnlyContainMovingWalkwayAmenity", "Validates that an Amenity, if present and contained (or touched) by a 'movingwalkway' Unit, is a 'movingwalkway' Amenity and not any other category of Amenity."],
["Amenity", "Warning", "OpenToBelowUnitMustNotContainAmenity", "Validates that an Amenity is not contained (or touched) by an 'opentobelow' Unit."],
["Amenity", "Warning", "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", "Validates i) '*.female', '*.male', '*.transgender', '*.unisex' (plus *.wheelchair) Amenity is not contained (or touched) by a 'restroom.family' Unit. ii) '*.family', '*.female', '*.male', '*.transgender' (plus *.wheelchair) Amenity is not contained (or touched) by a 'restroom.unisex' Unit."],
["Amenity", "Warning", "RestroomUnitMayOnlyContainAmenityFromRestroomHierarchy", "Validates that an Amenity, if present and contained (or touched) by a Unit whose category is in the Restroom hierarchy, also possesses a category from the Restroom hierarchy."],
["Amenity", "Warning", "StairsUnitMayOnlyContainStairsAmenity", "Validates that an Amenity, if present and contained (or touched) by a 'stairs' Unit, is a 'stairs' Amenity and not any other category of Amenity."],
["Amenity", "Warning", "StepsUnitMustNotContainAmenity", "Validates that an Amenity is not contained (or touched) by a 'steps' Unit."],
["Amenity", "Warning", "StructuralUnitMustNotContainAmenity", "Validates that an Amenity is not contained (or touched) by a Unit that models physical/structural elements, such as 'brick', 'column', 'concrete', 'drywall', 'glass', 'structure', and 'wood'."],
["Amenity", "Warning", "TrainBoardingGateAmenityShouldHaveName", "Validates that a 'boardinggate.train' Amenity possesses a name value."],
["Amenity", "Warning", "UnspecifiedAmenityShouldHaveName", "Validates that an 'unspecified' Amenity possesses a name."],
["Anchor", "Info", "ReferencedAddressDoesNotMatchBuildingAddress", "Validates that an Anchor's referenced Address (non-unit-qualified Address portion) matches the Building's Address."],
["Anchor", "Violation", "AnchorMustBeCoveredByReferencedUnit", "Validates that an Anchor is covered by the referenced Unit."],
["Anchor", "Violation", "AnchorMustHavePointGeometry", "Validates that an Anchor is a Point geometry."],
["Anchor", "Violation", "AnchorMustReferenceUnit", "Validates that an Anchor references a Unit."],
["Anchor", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Anchor", "Warning", "AnchorShouldNotEqualAnchor", "Validates that Anchors are not coincident on the same Level."],
["Anchor", "Warning", "OpenToBelowUnitMustNotContainAnchor", "Validates that an Anchor is not contained (or touched) by an 'opentobelow' Unit."],
["Anchor", "Warning", "StructuralUnitMustNotContainAnchor", "Validates that an Anchor is not contained (or touched) by a Unit that models physical/structural elements, such as 'brick', 'column', 'concrete', 'drywall', 'glass', 'structure', and 'wood'."],
["Building", "Info", "BuildingAddressResolvesToVenueAddress", "Validates that a Building and Venue do not share the same Address."],
["Building", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Building", "Violation", "BuildingCategoryMustBeValid", "Validates the category assigned to a Building."],
["Building", "Violation", "BuildingHasNoLevel", "Validates that a Building is referenced by at least one Level."],
["Building", "Violation", "BuildingMustHaveAtLeastOneFootprint", "Validates that a Building has at least one Footprint defined."],
["Building", "Violation", "BuildingMustHaveCategory", "Validates that a Building has a category."],
["Building", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Building", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Building", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Building", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Building", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Building", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Building", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Building", "Warning", "BuildingAltNameShouldBeDistinct", "Validates that a Building's alt_name is distinct."],
["Building", "Warning", "BuildingCategoryShouldBeParking", "Validates that a Building's category is 'parking' when all Level features referencing the Building possess the same category."],
["Building", "Warning", "BuildingFootprintGeometryMustContainDisplayPoint", "Validates that the display_point, when present, is within at least one (1) Footprint that references the Building."],
["Building", "Warning", "BuildingHasNoAddress", "Validates that a Building references an Address."],
["Building", "Warning", "BuildingHasNoAerialFootprint", "Validates that a Building references an 'aerial' Footprint."],
["Building", "Warning", "BuildingHasNoDisplayPoint", "Validates that a Building has a display_point."],
["Building", "Warning", "BuildingHasNoGroundFootprint", "Validates that a Building references a 'ground' Footprint."],
["Building", "Warning", "BuildingHasNoName", "Validates that a Building has a name."],
["Building", "Warning", "BuildingHasNoSubterraneanFootprint", "Validates that a Building references a 'subterranean' Footprint when the Building is also referenced by a Level that possesses a negative ordinal."],
["Building", "Warning", "BuildingLevelOrdinalZeroShouldBePresent", "Validates that a Building is referenced by a Level whose ordinal 0."],
["Building", "Warning", "BuildingNameIsNotDistinct", "Validates that a Building name is distinct."],
["Building", "Warning", "BuildingNameMatchesOccupantName", "Validates that a Building name does not match an Occupant name it 'contains'."],
["Building", "Warning", "BuildingReferencesUnitQualifiedAddress", "Validates that the Building's referenced Address is not a unit-qualified address."],
["Building", "Warning", "BuildingsHaveSameAddress", "Validates that Buildings do not share the same Address."],
["Building", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Building", "Warning", "LevelNamesInBuildingShouldBeDistinct", "Validates that Levels referencing the same Building possess dissimilar name values."],
["Building", "Warning", "LevelOrdinalsForBuildingAreNotSequential", "Validates that ordinal values among Levels referencing the same Building are sequential."],
["Building", "Warning", "LevelShortNamesInBuildingShouldBeDistinct", "Validates that Levels referencing the same Building possess dissimilar short_name values."],
["Building", "Warning", "NonMatchingNameLangTagsAmongLevelsReferencingSameBuilding", "Validates that a Level `name` language tag set is matched by another Level's `name` language tag set among Levels that reference the same Building."],
["Building", "Warning", "NonMatchingShortNameLangTagsAmongLevelsReferencingSameBuilding", "Validates that a Level short_name language tag set is matched by another Level's short_name language tag set among Levels that reference the same Building."],
["Building", "Warning", "ParkingBuildingReferencingNonParkingLevel", "Validates that a 'parking' Building is only referenced by a Level possessing the same category."],
["Detail", "Info", "DetailMustNotIntersectOpening", "Validates that a Detail does not intersect an Opening feature."],
["Detail", "Violation", "DetailMustBeCoveredByReferencedLevel", "Validates that a Detail feature is covered by the referenced Level."],
["Detail", "Violation", "DetailMustHaveLinealGeometry", "Validates that a Detail feature is a LineString or MultiLineString geometry."],
["Detail", "Violation", "DetailMustReferenceLevel", "Validates that a Detail references a Level."],
["Detail", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Fixture", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Fixture", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Fixture", "Violation", "FixtureCategoryMustBeValid", "Validates the category assigned to a Fixture."],
["Fixture", "Violation", "FixtureMustBeCoveredByReferencedLevel", "Validates that a Fixture is covered by the referenced Level."],
["Fixture", "Violation", "FixtureMustHaveCategory", "Validates that a Fixture has a category value."],
["Fixture", "Violation", "FixtureMustHavePolygonalGeometry", "Validates that a Fixture feature has Polygon or MultiPolygon geometry."],
["Fixture", "Violation", "FixtureMustNotEqualFixture", "Validates that Fixtures are not equal on the same Level."],
["Fixture", "Violation", "FixtureMustNotEqualUnit", "Validates that a Fixture is not equal to a Unit on the same Level."],
["Fixture", "Violation", "FixtureMustReferenceLevel", "Validates that a Fixture references a Level."],
["Fixture", "Violation", "FixturesMustNotOverlap", "Validates that Fixture interiors do not intersect."],
["Fixture", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Fixture", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Fixture", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Fixture", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Fixture", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Fixture", "Warning", "BaggageCarouselFixtureShouldHaveDisplayPointAndName", "Validates that a 'baggagecarousel' Fixture has both a display_point and name when the Fixture does not contain a 'baggagecarousel' Amenity."],
["Fixture", "Warning", "BaggageCarouselFixtureShouldHaveName", "Validates that a 'baggagecarousel' Fixture has a name value when it has a display_point, and the Fixture does not contain a 'baggagecarousel' Amenity."],
["Fixture", "Warning", "FixtureGeometryMustContainDisplayPoint", "Validates that the display_point is contained by the Fixture."],
["Fixture", "Warning", "FixtureHasInteriorRing", "Validates that a Fixture does not possess an interior ring."],
["Fixture", "Warning", "FixtureMustBeCoveredByUnit", "Validates that a Fixture is covered by a Unit."],
["Fixture", "Warning", "FixtureMustContainReferencedAnchor", "Validates that a Fixture contains the referenced Anchor."],
["Fixture", "Warning", "FixtureMustNotOverlapKiosk", "Validates that Fixture and Kiosk interiors do not intersect."],
["Fixture", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Fixture", "Warning", "OpenToBelowUnitMustNotContainFixture", "Validates that a Fixture is not contained by an 'opentobelow' Unit."],
["Fixture", "Warning", "StructuralUnitMustNotContainFixture", "Validates that a Fixture is not contained (or overlapped) by a Unit that models physical/structural elements, such as 'brick', 'column', 'concrete', 'drywall', 'glass', 'structure', and 'wood'."],
["Footprint", "Violation", "AerialFootprintMustNotContainOrEqualAerialFootprint", "Validates that an 'aerial' Footprint does not equal or contain another 'aerial' Footprint."],
["Footprint", "Violation", "FootprintCategoryMustBeValid", "Validates the category assigned to a Footprint."],
["Footprint", "Violation", "FootprintMustHavePolygonalGeometry", "Validates that a Footprint has a Polygon or MultiPolygon geometry."],
["Footprint", "Violation", "FootprintMustReferenceBuilding", "Validates that a Footprint references a Building."],
["Footprint", "Violation", "GroundFootprintMustNotContainOrEqualGroundFootprint", "Validates that a 'ground' Footprint does not equal or contain another 'ground' Footprint."],
["Footprint", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Footprint", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Footprint", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Footprint", "Warning", "AerialFootprintShouldCoverGroundFootprint", "Validates that an 'aerial' Footprint contains a 'ground' Footprint."],
["Footprint", "Warning", "AerialFootprintsShouldNotOverlap", "Validates that 'aerial' Footprints do not overlap."],
["Footprint", "Warning", "FootprintHasInteriorRing", "Validates that a Footprint does not possess an interior ring."],
["Footprint", "Warning", "GroundFootprintShouldIntersectSubterraneanFootprint", "Validates that a 'subterranean' Footprint intersects a 'ground' Footprint. Intersection may either be features that touch, or the interior geometry of one feature intersecting the interior geometry of another."],
["Footprint", "Warning", "GroundFootprintsShouldNotOverlap", "Validates that 'ground' Footprints do not overlap."],
["Footprint", "Warning", "IndoorLevelNotEqualToAerialFootprint", "Validates that the union of all Indoor Levels whose ordinal is '0' and greater, is equal to the 'aerial' Footprint referencing the same Building."],
["Footprint", "Warning", "IndoorLevelNotEqualToGroundFootprint", "Validates that the union of all Indoor Levels whose ordinal is '0' is equal to the 'ground' Footprint referencing the same Building."],
["Footprint", "Warning", "IndoorLevelNotEqualToSubterraneanFootprint", "Validates that the union of all Indoor Levels, ordinal '-1' and less, is equal to the 'subterranean' Footprint referencing the same Building."],
["Footprint", "Warning", "SubterraneanFootprintsOverlap", "Validates that 'subterranean' Footprints do not overlap."],
["Geofence", "Info", "GeofenceHasInteriorRing", "Validates that a Geofence does not possess an interior ring."],
["Geofence", "Info", "GeofenceHasNoBuildingReference", "Validates that a Geofence references a Building."],
["Geofence", "Info", "GeofenceHasNoLevelReference", "Validates that a Geofence references a Level."],
["Geofence", "Info", "GeofenceHasParentReference", "Validates that a Geofence has a parent reference."],
["Geofence", "Info", "GeofenceNotWithinReferencedBuildingFootprint", "Validates that a Geofence is within the referenced Building's union of Footprints."],
["Geofence", "Info", "GeofencesOverlap", "Validates that the interior geometry of a Geofence does not intersect the interior geometry of another on the same Level."],
["Geofence", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Geofence", "Violation", "CorrelationIdMustBeMatched", "Validates that a correlation_id is matched by at least one other feature's correlation_id in the same feature-type."],
["Geofence", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Geofence", "Violation", "GeofenceCategoryMustBeValid", "Validates the category assigned to a Geofence."],
["Geofence", "Violation", "GeofenceMustHaveCategory", "Validates that a Geofence has a category value."],
["Geofence", "Violation", "GeofenceMustHaveLevelOrBuildingReference", "Validates that a Geofence references at least one Level or Building."],
["Geofence", "Violation", "GeofenceMustHavePolygonalGeometry", "Validates that a Geofence has Polygon or MultiPolygon geometry."],
["Geofence", "Violation", "InvalidCorrelationID", "Validates that a 'correlation_id' is a valid v4 UUID value."],
["Geofence", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Geofence", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Geofence", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Geofence", "Violation", "LevelIDsMustBeDissimilarForCorrelationID", "Validates that features from the same feature-type, whose correlation_id match, possess dissimilar Level id values."],
["Geofence", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Geofence", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Geofence", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Geofence", "Warning", "CategoryShouldBeSameForCorrelationID", "Validates that features with matching correlation_id possess the same category."],
["Geofence", "Warning", "GeofenceGeometryMustContainDisplayPoint", "Validates that the display_point is within the Geofence."],
["Geofence", "Warning", "GeofenceNotCoveredByReferencedLevel", "Validates that a Geofence is covered by the referenced Level."],
["Geofence", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Kiosk", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Kiosk", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Kiosk", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Kiosk", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Kiosk", "Violation", "KioskMustBeCoveredByReferencedLevel", "Validates that a Kiosk is covered by the referenced Level."],
["Kiosk", "Violation", "KioskMustHavePolygonalGeometry", "Validates that a Kiosk has a Polygon or MultiPolygon geometry."],
["Kiosk", "Violation", "KioskMustNotEqualUnit", "Validates that a Kiosk does not equal a Unit."],
["Kiosk", "Violation", "KioskMustReferenceLevel", "Validates that a Kiosk feature references a Level."],
["Kiosk", "Violation", "KiosksMustNotOverlap", "Validates that Kiosk interiors do not intersect."],
["Kiosk", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Kiosk", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Kiosk", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Kiosk", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Kiosk", "Warning", "KioskGeometryMustContainDisplayPoint", "Validates that the display_point is within the Kiosk."],
["Kiosk", "Warning", "KioskHasInteriorRing", "Validates that a Kiosk does not possess an interior ring."],
["Kiosk", "Warning", "KioskMustBeCoveredByUnit", "Validates that a Kiosk is covered by a Unit."],
["Kiosk", "Warning", "KioskMustContainReferencedAnchor", "Validates that a Kiosk contains the referenced Anchor."],
["Kiosk", "Warning", "KioskShouldHaveAnchorOrContainAmenity", "Validates that a Kiosk references an Anchor or contains Amenity."],
["Kiosk", "Warning", "OpenToBelowUnitMustNotContainKiosk", "Validates that a Kiosk is not contained by an 'opentobelow' Unit."],
["Kiosk", "Warning", "StructuralUnitMustNotContainKiosk", "Validates that a Kiosk is not contained (or overlapped) by a Unit that models physical/structural elements, such as 'brick', 'column', 'concrete', 'drywall', 'glass', 'structure', and 'wood'."],
["Level", "Info", "LevelHasSuspiciousOrdinal", "Validates that a Level ordinal value is within the typical range. (>=-12 =<163)"],
["Level", "Info", "OutdoorLevelHasBuildingReference", "Validates that an outdoor Level on ordinal 0 does not reference a Building."],
["Level", "Info", "ParkingUnitIsNotContainedByParkingLevel", "Validates that a 'parking' Unit is contained by a 'parking' Level when the Level contains any other Unit category except: `office` `platform` `room` `unenclosedarea`."],
["Level", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Level", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Level", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Level", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Level", "Violation", "LevelCategoryMustBeValid", "Validates the category assigned to a Level."],
["Level", "Violation", "LevelMustBeReferencedByUnit", "Validates that a Level is referenced by at least one Unit."],
["Level", "Violation", "LevelMustHaveCategory", "Validates that a Level has a category value."],
["Level", "Violation", "LevelMustHaveName", "Validates that a Level has a name."],
["Level", "Violation", "LevelMustHaveOrdinal", "Validates that a Level has an ordinal."],
["Level", "Violation", "LevelMustHavePolygonalGeometry", "Validates that a Level has a Polygon or MultiPolygon geometry."],
["Level", "Violation", "LevelMustHaveShortName", "Validates that a Level has a short_name."],
["Level", "Violation", "LevelOrdinalMustBeInteger", "Validates that a Level ordinal is an integer value."],
["Level", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Level", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Level", "Warning", "IndoorLevelMustHaveBuildingReference", "Validates that an indoor Level references a Building."],
["Level", "Warning", "LevelAndAerialFootprintShouldReferenceSameBuilding", "Validates that a Level whose interior geometry intersects the interior geometry of an 'aerial' Footprint both reference the same Building."],
["Level", "Warning", "LevelAndGroundFootprintShouldReferenceSameBuilding", "Validates that a Level whose interior geometry intersects the interior geometry of a 'ground' Footprint both reference the same Building."],
["Level", "Warning", "LevelAndSubterraneanFootprintShouldReferenceSameBuilding", "Validates that a Level whose interior geometry intersects the interior geometry of a 'subterranean' Footprint both reference the same Building."],
["Level", "Warning", "LevelGeometryMustContainDisplayPoint", "Validates that the display_point is within the Level."],
["Level", "Warning", "LevelHasInteriorRing", "Validates that a Level does not possess an interior ring."],
["Level", "Warning", "LevelMustBeFullyCoveredByUnits", "Validates that the union of all Units is equal to the Level they reference."],
["Level", "Warning", "LevelShouldBeReferencedByOpening", "Validates that a Level is referenced by at least one Opening."],
["Level", "Warning", "LevelsShouldNotOverlap", "Validates that Level interiors do not intersect."],
["Level", "Warning", "OutdoorLevelHasNegativeOrdinal", "Validates that an outdoor Level does not have a negative ordinal."],
["Level", "Warning", "OutdoorLevelShouldNotOverlapGroundFootprint", "Validates that an outdoor Level whose ordinal is '0' does not overlap any Building's 'ground' Footprint."],
["Level", "Warning", "OutdoorLevelShouldReferenceBuilding", "Validates that an outdoor Level, on an ordinal other than 0, references a Building."],
["Level", "Warning", "ParkingLevelShouldContainParkingUnit", "Validates that a 'parking' Level contains a 'parking' Unit."],
["Level", "Warning", "ParkingLevelShouldHaveAutomobileOpening", "Validates that a 'parking' Level is referenced by an expected Opening category on the expected ordinal."],
["Level", "Warning", "ParkingUnitShouldBeContainedByParkingLevel", "Validates that a Level containing a 'parking' Unit, and no other Unit, is categorized as a 'parking' Level."],
["Manifest", "Violation", "ManifestVersionMustBeValid", "Validates the IMDF version declared in the Manifest geoJSON."],
["Occupant", "Info", "OccupantShouldHaveModifiedTime", "Validates that an Occupant has a modified time."],
["Occupant", "Violation", "CorrelationIdMustBeMatched", "Validates that a correlation_id is matched by at least one other feature's correlation_id in the same feature-type."],
["Occupant", "Violation", "EndDateTimeIsBeforeCurrentDateTime", "Validates that an end DATE-TIME is after the current (system) date-time."],
["Occupant", "Violation", "HoursMustNotBeBlank", "Validates that hours are not blank. (Not empty string or whitespace.)"],
["Occupant", "Violation", "InvalidCorrelationID", "Validates that a 'correlation_id' is a valid v4 UUID value."],
["Occupant", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Occupant", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Occupant", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Occupant", "Violation", "LevelIDsMustBeDissimilarForCorrelationID", "Validates that features from the same feature-type, whose correlation_id match, possess dissimilar Level id values."],
["Occupant", "Violation", "ModifiedDateTimeIsAfterCurrentDateTime", "Validates that a modified DATE-TIME is before the current (system) date-time."],
["Occupant", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Occupant", "Violation", "OccupantCategoryMustBeValid", "Validates the category assigned to an Occupant."],
["Occupant", "Violation", "OccupantMustHaveCategory", "Validates that an Occupant has a category value."],
["Occupant", "Violation", "OccupantMustHaveName", "Validates that an Occupant has a Name."],
["Occupant", "Violation", "OccupantMustReferenceAnchor", "Validates that an Occupant references an Anchor."],
["Occupant", "Violation", "PhoneMustBeValid", "Validates that the phone is correctly formatted."],
["Occupant", "Violation", "StartDateTimeIsAfterEndDateTime", "Validates that a start DATE-TIME` is before the end DATE-TIME."],
["Occupant", "Violation", "WebsiteMustBeValid", "Validates that a website URL is correctly formatted."],
["Occupant", "Warning", "CategoryShouldBeSameForCorrelationID", "Validates that features with matching correlation_id possess the same category."],
["Occupant", "Warning", "OccupantShouldHaveHours", "Validates that an Occupant has hours."],
["Occupant", "Warning", "OccupantShouldHavePhone", "Validates that an Occupant has a phone."],
["Occupant", "Warning", "OccupantShouldHaveWebsite", "Validates that an Occupant has a website."],
["Occupant", "Warning", "SimilarOccupantsShouldNotRefSameAnchor", "Validates that an Anchor reference is not matched among similarly named Occupants."],
["Opening", "Violation", "AccessControlMustBeValid", "Validates that the access_control category assigned to the Opening."],
["Opening", "Violation", "AccessibilityMustBeValid", "Validates the accessibility category assigned to the feature."],
["Opening", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Opening", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Opening", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Opening", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Opening", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Opening", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Opening", "Violation", "OpeningCategoryMustBeValid", "Validates the category assigned to an Opening."],
["Opening", "Violation", "OpeningDoorMaterialMustBeValid", "Validates that the Opening's door material is valid."],
["Opening", "Violation", "OpeningDoorTypeMustBeValid", "Validates that the Opening door type is valid."],
["Opening", "Violation", "OpeningMustBeCoveredByReferencedLevel", "Validates that an Opening is within the referenced Level."],
["Opening", "Violation", "OpeningMustHaveCategory", "Validates that an Opening has a category."],
["Opening", "Violation", "OpeningMustHaveLineStringGeometry", "Validates that an Opening has a LineString geometry."],
["Opening", "Violation", "OpeningMustReferenceLevel", "Validates that an Opening references a Level."],
["Opening", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Opening", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Opening", "Warning", "OpeningDisplayPointShouldBeWithinBufferedDistanceOfOpening", "Validates that an Opening display_point is within a buffered distance of the line-string."],
["Opening", "Warning", "OpeningIsSuspiciouslyLarge", "Validates that the Opening length does not exceed 45 meters."],
["Opening", "Warning", "OpeningIsSuspiciouslySmall", "Validates that the Opening length exceeds 0.8382 meters."],
["Opening", "Warning", "OpeningMustBeCoveredByUnitBoundary", "Validates that an Opening is covered by a Unit's boundary."],
["Opening", "Warning", "OpeningsMustNotCrossOrOverlap", "Validates that an Opening does not cross or overlap another Opening referencing the same Level."],
["Relationship", "Info", "RelationshipHasGeometry", "Validates that a Relationship has geometry."],
["Relationship", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Relationship", "Violation", "InvalidRelationshipDestinationReference", "Validates the integrity of a feature reference."],
["Relationship", "Violation", "InvalidRelationshipIntermediaryReference", "Validates the integrity of a feature reference."],
["Relationship", "Violation", "InvalidRelationshipOriginReference", "Validates the integrity of a feature reference."],
["Relationship", "Violation", "RelationshipCategoryMustBeValid", "Validates the category assigned to a Relationship."],
["Relationship", "Violation", "RelationshipDirectionMustBeValid", "Validates the direction assigned to a Relationship."],
["Relationship", "Violation", "RelationshipMustHaveCategory", "Validates that a Relationship has a category."],
["Section", "Info", "SectionHasInteriorRing", "Validates that a Section does not possess an interior ring."],
["Section", "Info", "SectionHasParentReference", "Validates that a Section has a parent reference."],
["Section", "Info", "SectionsOverlap", "Validates that Section interiors do not intersect on the same Level."],
["Section", "Violation", "AccessibilityMustBeValid", "Validates the accessibility category assigned to the feature."],
["Section", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Section", "Violation", "CorrelationIdMustBeMatched", "Validates that a correlation_id is matched by at least one other feature's correlation_id in the same feature-type."],
["Section", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Section", "Violation", "InvalidCorrelationID", "Validates that a 'correlation_id' is a valid v4 UUID value."],
["Section", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Section", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Section", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Section", "Violation", "LevelIDsMustBeDissimilarForCorrelationID", "Validates that features from the same feature-type, whose correlation_id match, possess dissimilar Level id values."],
["Section", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Section", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Section", "Violation", "SectionCategoryMustBeValid", "Validates the category assigned to a Section."],
["Section", "Violation", "SectionMustBeCoveredByReferencedLevel", "Validates that a Section is covered by the referenced Level."],
["Section", "Violation", "SectionMustHaveCategory", "Validates that a Section has a category."],
["Section", "Violation", "SectionMustHavePolygonalGeometry", "Validates that a Section has a Polygon or MultiPolygon geometry."],
["Section", "Violation", "SectionMustReferenceLevel", "Validates that a Section references a Level."],
["Section", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Section", "Warning", "CategoryShouldBeSameForCorrelationID", "Validates that features with matching correlation_id possess the same category."],
["Section", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Section", "Warning", "SectionGeometryMustContainDisplayPoint", "Validates that the display_point is within its Section."],
["Unit", "Violation", "AccessibilityMustBeValid", "Validates the accessibility category assigned to the feature."],
["Unit", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Unit", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Unit", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Unit", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Unit", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Unit", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Unit", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Unit", "Violation", "UnitCategoryMustBeValid", "Validates the category assigned to a Unit."],
["Unit", "Violation", "UnitMustBeCoveredByReferencedLevel", "Validates that a Unit is covered by the referenced Level."],
["Unit", "Violation", "UnitMustHaveCategory", "Validates that a Unit has a category."],
["Unit", "Violation", "UnitMustHavePolygonalGeometry", "Validates that a Unit has Polygon or MultiPolygon geometry."],
["Unit", "Violation", "UnitMustReferenceLevel", "Validates that a Unit references a Level."],
["Unit", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Unit", "Warning", "HasOnlyAltName", "Validates that an alt_name value is not exclusive, that it is accompanied by a name value."],
["Unit", "Warning", "UnitGeometryMustContainDisplayPoint", "Validates that a display_point, if present, is contained by the Unit."],
["Unit", "Warning", "UnitsMustNotOverlap", "Validates that Unit interiors do not intersect."],
["Venue", "Violation", "AltNameMustBeString", "Validates that an alt_name is a string data type."],
["Venue", "Violation", "DisplayPointMustBePointGeometry", "Validates that a display_point is a point geometry type."],
["Venue", "Violation", "HoursMustNotBeBlank", "Validates that hours are not blank. (Not empty string or whitespace.)"],
["Venue", "Violation", "InvalidFeatureID", "Validates that a feature ID is a valid v4 UUID value."],
["Venue", "Violation", "InvalidLanguageTag", "Validates that a language tag is a valid value."],
["Venue", "Violation", "LabelMustNotBeBlank", "Validates that a Label (prefLabel and altLabel) is not blank."],
["Venue", "Violation", "NameMustBeString", "Validates that a name is a string data type."],
["Venue", "Violation", "PhoneMustBeValid", "Validates that the phone is correctly formatted."],
["Venue", "Violation", "RestrictionCategoryMustBeValid", "Validates the category assigned to a Restriction."],
["Venue", "Violation", "VenueCategoryMustBeValid", "Validates the category assigned to a Venue."],
["Venue", "Violation", "VenueGeometryMustContainDisplayPoint", "Validates that a display_point assigned to a Venue feature is contained by its polygonal geometry."],
["Venue", "Violation", "VenueMustCoverAllChildFeatures", "Validates that all features are contained within the Venue."],
["Venue", "Violation", "VenueMustHaveAddress", "Validates that a Venue references an Address."],
["Venue", "Violation", "VenueMustHaveAtLeastOneBuilding", "Validates that a delivery contains at least one Building."],
["Venue", "Violation", "VenueMustHaveCategory", "Validates that the Venue has a category."],
["Venue", "Violation", "VenueMustHaveName", "Validates that a Venue has a Name."],
["Venue", "Violation", "VenueMustHavePolygonalGeometry", "Validates that a Venue has Polygon or MultiPolygon geometry."],
["Venue", "Violation", "WebsiteMustBeValid", "Validates that a website URL is correctly formatted."],
["Venue", "Warning", "AltNameLangTagHasNoCorrespondingNameLangTag", "Validates that a language tag associated with an alt_name has a corresponding presence and association with a name value."],
["Venue", "Warning", "VenueGeometryShouldNotHaveInteriorRing", "Validates that a Venue does not possess an interior ring."],
["Venue", "Warning", "VenueHasNoDisplayPoint", "Validates that the Venue has a display_point."],
["Venue", "Warning", "VenueShouldHaveHours", "Validates that a Venue has hours (of operation)."],
["Venue", "Warning", "VenueShouldHavePhone", "Validates that a Venue has a phone (telephone number)."],
["Venue", "Warning", "VenueShouldHaveWebsite", "Validates that a Venue has a website."]
]; // [feature, severity, rule, definition]

// Toegestane waarden (OGC 20-094, Categories- en Reference-pagina)
const IMDF_ENUMS = {
  venue: "airport airport.intl aquarium businesscampus casino communitycenter conventioncenter governmentfacility healthcarefacility hotel museum parkingfacility resort retailstore shoppingcenter stadium stripmall theater themepark trainstation transitstation university",
  building: "parking transit transit.bus transit.train unspecified",
  footprint: "aerial ground subterranean",
  level: "arrivals arrivals.domestic arrivals.intl departures departures.domestic departures.intl parking transit unspecified",
  opening: "automobile bicycle emergencyexit pedestrian pedestrian.principal pedestrian.transit service",
  relationship: "elevator escalator movingwalkway ramp stairs traversal traversal.path",
  geofence: "concourse geofence paidarea platform postsecurity presecurity terminal underconstruction",
  accessibility: "assisted.listening braille hearing hearingloop signlanginterpreter tactilepaving tdd trs volume wheelchair",
  restriction: "employeesonly restricted",
  accesscontrol: "badgereader fingerprintreader guard keyaccess outofservice passwordaccess retinascanner voicerecognition",
  // Reference-pagina en Categories-tabel verschillen ("door" en "unspecified" alleen in de tabel): beide toegestaan
  doortype: "movablepartition open revolving shutter sliding swinging turnstile turnstile.fullheight turnstile.waistheight door unspecified",
  doormaterial: "wood glass metal gate",
  unit: "auditorium brick classroom column concrete conferenceroom drywall elevator escalator fieldofplay firstaid fitnessroom foodservice footbridge glass huddleroom kitchen laboratory library lobby lounge mailroom mothersroom movietheater movingwalkway nonpublic office opentobelow parking phoneroom platform privatelounge ramp recreation restroom restroom.family restroom.female restroom.female.wheelchair restroom.male restroom.male.wheelchair restroom.transgender restroom.transgender.wheelchair restroom.unisex restroom.unisex.wheelchair restroom.wheelchair road room serverroom shower smokingarea stairs steps storage structure terrace theater unenclosedarea unspecified vegetation waitingroom walkway walkway.island wood",
  section: "arcade baggageclaim baggageclaim.intl carrental carrental.dropoff checkin concessions cubicle dutyfree eatingdrinking entertainmentarea entertainmentarea.game entertainmentarea.music entertainmentarea.performance entertainmentarea.sport exhibit exhibition gambling gambling.baccarat gambling.bingo gambling.blackjack gambling.craps gambling.keno gambling.mahjong gambling.medalgame gambling.minibaccarat gambling.offtrackbetting gambling.pachinko gambling.paigow gambling.poker gambling.poker.letitride gambling.poker.paigow gambling.poker.threecard gambling.poker.video gambling.roulette gambling.rummy gambling.sicbo gambling.slotmachine gambling.slotmachine.highlimit gatearea gatearea.holding immigration immigration.schengen information paidarea parkandride parking parking.bicycle parking.compact parking.ev parking.longterm parking.motorcycle parking.shortterm parking.waitingarea platform postsecurity presecurity private recomposearea recreation rental retail retaildepartment road seating seatingrow security servicearea ticketing vegetation walkway",
  fixture: "baggagecarousel boardinggate.desk checkin.desk checkin.kiosk desk equipment furniture immigration.desk inspection.desk obstruction securityequipment stage vegetation wall water",
  amenity: "amphitheater animalreliefarea arrivalgate atm babychanging baggagecarousel baggagecarousel.intl baggagecarts baggageclaim baggageclaim.oversize baggagerecheck baggagestorage boardinggate boardinggate.aircraft boardinggate.bus boardinggate.ferry boardinggate.train bus bus.muni bus.national businesscenter cabin caregiver carrental cashier changemachine checkin checkin.desk checkin.desk.oversizebaggage checkin.desk.transfer checkin.selfservice childplayarea coinlocker copymachine defibrillator drinkingfountain eatingdrinking elevator emergencyshelter entry escalator exhibit faregate faregate.oversized fieldofplay fieldofplay.americanfootball fieldofplay.baseball fieldofplay.basketball fieldofplay.fieldhockey fieldofplay.icehockey fieldofplay.rugby fieldofplay.soccer fieldofplay.softball fieldofplay.tennis fieldofplay.trackfield fieldofplay.volleyball firealarmpullstation fireextinguisher firstaid fittingroom foodservice gatearea groundtransportation guestservices handsanitizerstation healthscreening hoteling immigration information information.bid information.carrental information.hotel information.mufid information.mufid.arrivals information.mufid.departures information.transit landmark library limo lostandfound mailbox meditation meetingpoint mobilityrescue mothersroom movingwalkway paidarea parkandride parking parking.bicycle parking.compact parking.ev parking.longterm parking.motorcycle parking.shortterm parking.waitingarea payphone pedestriancrossing peoplemover phone phone.emergency photobooth platform police powerchargingstation prayerroom prayerroom.buddhism prayerroom.christianity prayerroom.hinduism prayerroom.islam prayerroom.islam.female prayerroom.islam.male prayerroom.judaism prayerroom.shintoism prayerroom.sikh prayerroom.taoic privatelounge productreturn rail.muni rail.national ramp reception.desk recreation restroom restroom.family restroom.female restroom.female.wheelchair restroom.male restroom.male.wheelchair restroom.transgender restroom.transgender.wheelchair restroom.unisex restroom.unisex.wheelchair restroom.wheelchair rideshare seat seating security security.checkpoint security.inspection service shower shuttle sleepbox smokingarea stairs storage strollerrental studentadmissions studentservices swimmingpool swimmingpool.children swimmingpool.family taxi ticketing ticketing.airline ticketing.bus ticketing.bus.muni ticketing.bus.national ticketing.rail ticketing.rail.muni ticketing.rail.national ticketing.shuttle traintrack transit unspecified valet vendingmachine vendingmachine.trainticket wheelchairassist wifi yoga",
  occupant: "3dprinting acai accessories accounting acnetreatment acupuncture adoptionservices adulteducation adultentertainment adultstore advertising advisoryservices afghani african agritourism airfield airline airport.regional airportloungebar airportshuttle airsoft allergies alternativemedicine american.modern amusementpark amusementpark.ride animalshelter antiques apmstop appliances arabian arabian.pizza arcade archery architecture argentine armenian artgallery artinstruction arts.entertainment artsandcrafts artschool artstudio artstudio.rental artsupplies asianfusion astrologist asturian atm atm.cryptocurrency audiovideoequipment auditory australian australian.modern austrian austrian.schnitzel auto.accessibilityequipment auto.bodyshop auto.carbuyer auto.carshare auto.carwash auto.dealer.boat auto.dealer.car auto.dealer.motorcycle auto.dealer.rv auto.dentrepair.mobile auto.detailing auto.electric auto.evcharge auto.evcharge.dcfast auto.evcharge.tesla auto.glass auto.oilchange auto.parts auto.repair auto.repair.transmission auto.repair.wheelrim auto.repair.windshield auto.servicestation auto.shipping auto.stereoinstallation auto.tires auto.upholstery automotive autopartssupplies babyclothesandsupplies bagels bakedgoods ballonservices bangladeshi bank bar barbecue barber barfood barreclass baseballfield bathingarea batteries battingcages beach beautysalon beautyspas bedbreakfast beerbar beergarden beerhall beerwineandspirits beerwinespirits beisl belgian belgian.flemish bengali beveragestore bicycle.repair bicyclerental bicycleshop bikesandequipment billingservices bingo biryani bistro blacksea blinds blooddonation blooddonationcenter bodycontouring bodypiercing books booksmagazinesmusicvideo botanicalgarden bowlingalley boxing brazilian brazilian.centralbrazil brazilian.empanadas brazilian.northeasternbrazil brazilian.northernbrazil breakfastandbrunch brewery brewpub bridalstore british bubbletea buffet buildingsupplies bulgarian bulkmedicalbilling bungeejumping burgers burmese businesscampus businessconsulting busrental busstop butcher cabinets cafe cafeteria cajun cakes calligraphy cambodian canadian.modern candy candy.dagashi cannabisdispensary canteen cardioclasses cardiology cards.stationery careercounseling caribbean caricaturist carouselride carpet carrental catering cellphoneaccessories challengecourse champagnebar cheese cheesesteaks chickenshop chickenwings childbirthschool childcare chilean chimneycakes chinese chinese.cantonese chinese.dimsum chinese.fuzhou chinese.hainan chinese.hakka chinese.henghwa chinese.hokkien chinese.hunan chinese.pekinese chinese.shanghainese chinese.szechuan chinese.teochew chinesebazaar chiropractic chocolate christmastrees churros cider cigarbar cinema cityhall climbing clinic clockrepair clothing clothing.bespoke clothing.childrens clothing.mens clothing.plussize clothing.womens cocktailbar coffee coffee.tea coffeeroaster coffeeteasupplies coincashingkiosk college colombian comedyclub comfortfood comicbooks commercialrealestate commissionedartists communitybookbox communitycenter computersandaccessories conceptshop concourse condominium congee constructionequipmentrental contractors conveniencestore conveyorsushi cooking.instruction cookingschool copyshop corporateheadquarters corporateoffices corsican cosmetics cosmeticsurgery cosmetologyschool costumes countertopinstallation countryclub courier crepes cryotherapy cuban culturalcenter cupcakes currencyexchange customcakes custommerchandise cyclingclass cypriot czech danceclub danceschool dancestudio dancewear danish datarecovery dayspa dealer.usedvehicle delicatessen delicatessen.sandwiches dentalhygiene dentistry dentistry.cosmetic dentistry.general dentistry.pediatric departmentstore deptartmentstore dermatology desserts diagnosticimaging diagnosticservices dialysis dietician digitizingservices diner dinnertheater discountstore distillery divebar diyfood dmv dominican donair donationcenter donuts doorsalesandinstallation drivingrange drivingschool drycleaning drycleaninglaundry dumplings dumpsterrental dutyfree earnosethroat easterneuropean eatertainment editorialservices education educationservices egyptian electricians electronicappliances electronicparts electronicsrepair elementaryschool embroiderycrochet emergencymedicine emissionstesting empanadas employmentagency endodontics engraving escapegame ethiopian ethnicgrocerystore european.modern eventplanning eventspace experiences eyelashes eyewear.opticians fabricstore fairground falafel familyfriendly familyfuncenter familymedicine familyplanning familyrestaurant farm farmersmarket fashion fashionaccessories fastfood fencing fengshui ferry fieldofplay filipino financialservices fingerprinting firearmstrainingschool fish fishandchips fitnessbootcamp fitnessequipment fitnessinstruction fixedbaseoperator flatbread flightinstructionschool floatspa flooringinstallationandrepair floraldesign florist florists flowers fondue foodcourt fooddelivery foodstand foodtruck formalwear formalwear.rental freiduria french french.alsatian french.auvergnat french.baguette french.berrichon french.bourguignon french.brasserie french.lyonnais french.nicois french.provencal friterie frozenfoods fruitandvegetables fuelstation funeralservices furclothing furniture furniture.rental furniturestore gardening gastroenterology gastropubs gelato georgian german german.baden german.bavarian german.currysausage german.easterngerman german.fischbroetchen german.franconian german.hessian german.heuriger german.northerngerman german.palatine german.rhinelandian german.swabian giblets giftshops glutenfree gokarting goldmerchants golf golf.instruction golfequipment golfshop gourmetfood gourmetmarket graphicaldesign greek grillingequipment grocery grocery.asian grocery.chinese grocery.indian grocery.japanese grocery.korean grocery.persian grocerystore guitarstore gunrange gunsandammo gym gymnastics hairblowout haircutsstyling haircutsstyling.mens hairextensions hairloss hairremoval hairremoval.laser hairremoval.threading hairremoval.waxing hairstylist haitian halal hardware hats hauntedhouse hawaiian headshop healthcare healthcarecenter healthyfoods hearingaidproviders hearingaids hennaartist herbalmedicine herbsandspices highschool himalayan hobbyshop holidaydecorations homeandgarden homeappliancerepair homeautomation homecleaning homedecor homedevelopers homegarden homehealthcare homeopathy hometheaterinstallation honey hongkong.cafe hookahbar horsequipment hospital hostel hotdogs hotel hotel.business hotel.capsule hotelbar hotpot hottubandpool housingcooperative hungarian huntingfishingsupplies hvac hypermarket iberian icecream importedfood indian indian.andhra indian.assamese indian.awadhi indian.bihari indian.chettinad indian.goan indian.gujarat indian.hyderabadi indian.kerala indian.konkan indian.lucknowi indian.maharashtrian indian.malwani indian.mangalorean indian.northindian indian.oriya indian.rajasthani indian.southindian indonesian informationtechnology installmentloanservices insulationinstallation insurance insurance.auto insurance.health insurance.home insurance.life interiordesign internalmedicine internationalfood internetbooth internetcafe internetserviceprovider investmentbanking irish irishpub israeli italian italian.abruzzese italian.altoatesine italian.apulian italian.calabrian italian.cucinacampana italian.diner italian.emilian italian.friulan italian.lumbard italian.napoletana italian.norcinerie italian.piedmont italian.roman italian.sardinian italian.sicilian italian.tuscan italian.venetian ivhydration izakaya japanese japanese.bento japanese.blowfish japanese.curry japanese.donburi japanese.gyudon japanese.handrolls japanese.horumon japanese.kushikatsu japanese.nikkei japanese.oden japanese.okonomiyaki japanese.onigiri japanese.oyakodon japanese.ramen japanese.shabushabu japanese.soba japanese.sukiyaki japanese.takoyaki japanese.tempura japanese.teppanyaki japanese.tonkatsu japanese.udon japanese.unagi japanese.westernjapanese japanese.yakiniku japanese.yakitori japanesesweets jewelry jewelryrepair jewish juicebar kaiseki karaoke kashmiri kebab kidsactivities kimonos kindergarten kiosk kiosk.food kitchenandbath kitchenincubator knifesharpening knittingsupplies kopitiam korean kosher kurdish laboratorytesting landmark landscaping languageschool laotian lasereyesurgery lasertag latinamerican laundromat laundryservices lawyer lawyer.business lawyer.criminaldefense lawyer.divorce lawyer.estateplanning lawyer.immigration lawyer.litigation lawyer.personalinjury lawyer.realestate lawyer.tax lawyer.willtrustprobate lawyer.workerscomp leathergoods lebanese legalservices library lifecoach lighting ligurian limo linens lingerie livestocksales localservices locksmith lotterystand loungebar luggage luggagestorage macaron magicians mailboxcenter makeupartist malaysian mamak manicurists marketing martialarts massageschool massagetherapist massagetherapy maternitywear mattresses mauritian meatballs medicalcenter medicalspa medicalsupplies mediterranean mexican mexican.easternmexican mexican.jaliscan mexican.modern mexican.northernmexican mexican.oaxacan mexican.pueblan mexican.yucatan middleeastern militarybase milkbar milkshakes minigolf mobilephonerepair mobilephones moneytransferservices mongolian moroccan mortgagebroker motorcyclingclothing movierental.kiosk mughlai museum.art museum.children museum.history musicalinstruments musicalinstrumentservices musicvenue musicvideo naga nasilemak naturopathy nepalese newspapersandmagazines newzealand nicaraguan nightfood nonprofit noodles northamerican.traditional norwegian notarypublic nurseries.gardening nyonya obgyn observatory occupationaltherapy officebuilding officeequipmentandsupplies okinawan oliveoil opensandwiches opera.ballet opthamalogy opticians optometry oralsurgery organicfood oriental orthodontics orthopedics orthotics osteopathy ottoman outdoorfurniture outdoorgear outletmall outletstore oxygenbar pachinko packagelocker packing packingsupplies paella painmanagement paintandsip painting paintstores paintyourownpottery pakistani parentingschool parking parks parma parsi partycharacters partyequipment.rental partysupplies passportvisaservices pasta pathology pawn paydayloan pediatrics performingarts perfume periodontics permanentmakeup persian personalcare personalshopper personaltrainer peruvian pets pets.adoption pets.boarding pets.grooming pets.photography pets.sitting pets.training pets.transportation petstore petstore.fish petstore.reptile pharmacy pharmacystore phonechargingstation photobooth.rental photography photography.event photography.session photographyequipment photographystore physicaltherapy physician piadina pianobar pianostore pictureframing pilates pita pizza placeofworship placeofworship.church placeofworship.mosque placeofworship.synagogue placeofworship.unitarian planetarium plasticsurgery playcenter playground playsets plaza podiatrists podiatry poke poledancingschool policestation policestation.koban polish polish.pierogis poolcleaning poolhall pooltablesupplies popcorn popup popupshops portuguese portuguese.alentejo portuguese.algarve portuguese.azores portuguese.beira portuguese.fadohouse portuguese.madeira portuguese.minho portuguese.ribatejo portuguese.trasosmontes postoffice postoffice.authorizedagent potatoes poutineries prenatal preschool pretzels preventivemedicine printmedia privateinvestigation privatejetcharter privateschool privateshuttlebus professionalservices professionalsportsteam propertymanagement psychiatrists psychiatry psychic psychology pub publicart publiclibrary publicservices.government publictransport puertorican pulmonology punjabi racetrack radiology radiostation rawfood realestate.agents realestate.services realestateagents realestateagents.commercial realestateservices recordingstudio recreation recreationcenter recyclingcenter reflexology religiousitems rental.videoandgame researchanddevelopment residentialapartments restaurant retirementhome reunionnese reupholstery riceshop rideshare robatayaki rockclimbing rodizio romanian roofing rotisseriechicken rugs russian sakebar salad salvadoran sandwiches sauna scandinavian scandinaviandesign school scottish screenprinting screenprinting.tshirt seafood seafoodmarket securitysystems selfstorage senegalese seniorcenter serbianandcroatian sewingalterations sharedofficespace shavedice shavedsnow shippingcenters shippingdropbox shoerepair shoes shoeshine shoestore shopping shoppingpassage shutterinstallation signature signmaking silentdisco singaporean skatepark skatingequipment skatingrink skiequipment skincare skydiving sleepwear slovakian soccer socialclub socialservices softwaredevelopment solarinstallation sommeliers soulfood soup southafrican southernunitedstates southwestunitedstates souvenirs spanish spanish.andalusian spanish.basque spanish.catalan spanish.galician specialtyfood specialtyschool spinclass spiritualproducts sportinggoods sportsbar sportsclub sportsequipment.rental sportsgoods sportsmedicine sportsschool sportswear srilankan stationery steak stockings streetvendor structuralengineers subwaystation supermarket supperclub surfacerefinishing surfing surfingequipment surgeon sushi swedish swedish.traditional swimminginstruction swimmingpool swimwear swiss syrian taberna tabletopgames tableware tacos taiwanese taiyaki talentagencies tamales tanningbeds tanningservices tapas tapas.smallplate tattoo tattoo.removal taxi taxistand taxoffice taxservices tea teachersupplies teambuilding teethwhitening telecommunications televisionserviceproviders televisionstation tennis.instruction terminal terminal.bus testpreparationschool texmex thai theater.drivein theater.movie themedcafe thriftstore tibetan tickets tikibar titleloan tobaccoshop tofu touristattraction tours tours.boat tours.bus tours.scooter tours.walking towncarservice toys toystore traditionalchinesemedicine trainserviceprovider trainstation trampolining transitlounge translationservices transportationservices trattoria travelagent travelservices trinidadian trophyshops truckrental tuina turkish turkish.cheekufta turkish.gozleme turkish.homemadefood turkish.lahmacun turkish.ravioli tutoring ukrainian uniforms urgentcare usedbooks utilities uzbek vacationhome vacationhome.agent valetservices vapeshops vascularmedicine vegan vegetarian vendingmachine vendingmachine.beverage venezuelan venison veteransorganization veterinarian videofilmproduction videogamesandconsoles vietnamese vintageclothing vinylrecords virtualreality visitorcenter vitaminssupplements vocalcoach vocationalschool waffles walkinclinic warehouse watches watchrepair waterpark waterpurification webdesign weddingchappel weddingplanning weightloss welsh whiskeybar wholesalemerchant wholesaler wigs windowinstallation winebar winery winetasting wok wraps yoga youthclub yugoslav",
};
for (const k in IMDF_ENUMS) IMDF_ENUMS[k] = new Set(IMDF_ENUMS[k].split(/[\s,]+/).filter(Boolean));

// Toegestane geometrie per featuretype (null = unlocated)
const IMDF_GEOM = {
  address: [null], building: [null], occupant: [null],
  amenity: ["Point"], anchor: ["Point"],
  detail: ["LineString", "MultiLineString"], opening: ["LineString"],
  fixture: ["Polygon", "MultiPolygon"], footprint: ["Polygon", "MultiPolygon"], geofence: ["Polygon", "MultiPolygon"],
  kiosk: ["Polygon", "MultiPolygon"], level: ["Polygon", "MultiPolygon"], section: ["Polygon", "MultiPolygon"],
  unit: ["Polygon", "MultiPolygon"], venue: ["Polygon", "MultiPolygon"],
  relationship: [null, "Point", "LineString", "MultiLineString", "Polygon", "MultiPolygon"],
};
const IMDF_TYPES = Object.keys(IMDF_GEOM);
const IMDF_REQUIRED_FILES = ["address", "building", "footprint", "level", "unit", "venue"];

function validateIMDF({ data, fileNames = [], now = new Date(), lang = null }) {
  const R = new Map(IMDF_RULES.map(([f, s, r, d]) => [f + "|" + r, { feature: f, severity: s, rule: r, definition: d, checked: false, partial: null, count: 0 }]));
  const issues = [];
  const F = t => t === "*" ? "N/A" : t[0].toUpperCase() + t.slice(1);   // "unit" → "Unit"
  const rule = (t, r) => R.get(F(t) + "|" + r);
  const mark = (t, ...rs) => rs.forEach(r => { const x = rule(t, r); if (x) x.checked = true; });
  const partial = (t, r, note) => { const x = rule(t, r); if (x) { x.checked = true; x.partial = note; } };
  const add = (t, r, fid, msg, attr = null, ftype = t) => {
    const x = rule(t, r); if (!x) return;
    x.checked = true; x.count++;
    issues.push({ severity: x.severity, rule: r, feature: x.feature, ftype: ftype === "*" ? null : ftype, fid: fid ?? null, attr, msg });
  };

  // ---------- Hulpfuncties ----------
  const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const blank = s => typeof s === "string" && (s.trim() === "" || s !== s.trim());
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const langOk = tag => { try { return typeof tag === "string" && Intl.getCanonicalLocales(tag).length === 1 && /^[a-z]{2,3}([-_]|$)/i.test(tag); } catch { return false; } };
  const regionName = (() => { try { const dn = new Intl.DisplayNames(["en"], { type: "region" }); return c => { try { return dn.of(c); } catch { return null; } }; } catch { return () => null; } })();
  const lbl = v => isObj(v) ? (lang && v[lang]) || Object.values(v)[0] : null;
  const str = v => v == null ? "—" : typeof v === "string" ? `"${v.length > 60 ? v.slice(0, 60) + "…" : v}"` : JSON.stringify(v).slice(0, 80);
  const ptInRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const ptOnSeg = (x, y, r) => { for (let i = 0; i < r.length - 1; i++) { const [ax, ay] = r[i], [bx, by] = r[i + 1]; const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax); if (Math.abs(cross) > 1e-12) continue; if (Math.min(ax, bx) - 1e-12 <= x && x <= Math.max(ax, bx) + 1e-12 && Math.min(ay, by) - 1e-12 <= y && y <= Math.max(ay, by) + 1e-12) return true; } return false; };
  // Punt binnen (of op de rand van) een Polygon/MultiPolygon
  const ptInGeom = (p, g) => {
    if (!g || !p) return false;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    return polys.some(rings => { if (!rings?.[0]) return false; if (ptOnSeg(p[0], p[1], rings[0])) return true; if (!ptInRing(p[0], p[1], rings[0])) return false;
      return !rings.slice(1).some(h => ptInRing(p[0], p[1], h) && !ptOnSeg(p[0], p[1], h)); });
  };
  const bboxOf = g => { const b = [Infinity, Infinity, -Infinity, -Infinity]; const w = c => { if (typeof c?.[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c?.forEach(w); }; w(g?.coordinates); return b; };
  const geomKey = g => g ? g.type + JSON.stringify(g.coordinates) : null;
  const hasInterior = g => g?.type === "Polygon" ? g.coordinates.length > 1 : g?.type === "MultiPolygon" ? g.coordinates.some(p => p.length > 1) : false;
  const isPoint = g => g?.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2 && g.coordinates.every(Number.isFinite);
  const metres = (a, b) => { const R0 = 6371008.8, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2; return 2 * R0 * Math.asin(Math.sqrt(h)); };
  const lineLen = c => { let s = 0; for (let i = 1; i < c.length; i++) s += metres(c[i - 1], c[i]); return s; };

  // ---------- Bestanden en structuur ----------
  const feats = {}, byId = new Map(), byType = {};
  IMDF_TYPES.forEach(t => byType[t] = []);
  mark("*", "NameMustBeString", "ManifestFileMustBePresent", "FileMustContainFeatureCollection", "FeatureMustHaveId", "FeatureIdMustBeString", "FeatureIdMustNotBeEmpty",
    "FeatureIdMustBeUnique", "FeatureMustHaveFeatureType", "FeatureTypeMustBeString", "FeatureTypeMustNotBeEmpty", "VenueCountMustBeExactlyOne",
    "ReferencedFeatureIDMustBeResolvable", "ZeroCountOfUnitQualifiedAddresses");
  partial("*", "FileMustBeValidGeoJSON", "Structuur, coördinaten, gesloten ringen, minimaal aantal punten en dubbele opeenvolgende punten; snijdende lijnsegmenten worden niet gecontroleerd.");
  if (!data.manifest) add("*", "ManifestFileMustBePresent", null, "manifest.json ontbreekt in het archief.", null, "*");
  for (const t of IMDF_REQUIRED_FILES) if (!data[t]) add("*", "FileMustContainFeatureCollection", null, `${t}.geojson ontbreekt (verplicht bestand).`, null, "*");
  for (const t of IMDF_TYPES) {
    const fc = data[t]; if (fc == null) continue;
    if (!isObj(fc) || fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) { add("*", "FileMustContainFeatureCollection", null, `${t}.geojson bevat geen GeoJSON FeatureCollection.`, null, "*"); continue; }
    feats[t] = fc.features;
    fc.features.forEach((f, i) => {
      const where = `${t}.geojson, feature ${i + 1}`;
      if (!isObj(f) || f.type !== "Feature") { add("*", "FileMustBeValidGeoJSON", null, `${where}: geen GeoJSON Feature.`, null, "*"); return; }
      if (!("id" in f)) add("*", "FeatureMustHaveId", null, `${where}: id ontbreekt.`, "id", t);
      else if (typeof f.id !== "string") add("*", "FeatureIdMustBeString", null, `${where}: id is geen string (${str(f.id)}).`, "id", t);
      else if (f.id.trim() === "") add("*", "FeatureIdMustNotBeEmpty", null, `${where}: id is leeg.`, "id", t);
      else if (byId.has(f.id)) add("*", "FeatureIdMustBeUnique", f.id, `id komt meer dan eens voor (ook in ${byId.get(f.id).feature_type}.geojson).`, "id", t);
      else byId.set(f.id, f);
      if (!("feature_type" in f)) add("*", "FeatureMustHaveFeatureType", f.id, `${where}: feature_type ontbreekt.`, "feature_type", t);
      else if (typeof f.feature_type !== "string") add("*", "FeatureTypeMustBeString", f.id, `feature_type is geen string.`, "feature_type", t);
      else if (f.feature_type.trim() === "") add("*", "FeatureTypeMustNotBeEmpty", f.id, `feature_type is leeg.`, "feature_type", t);
      else if (f.feature_type !== t) add("*", "FileMustBeValidGeoJSON", f.id, `feature_type "${f.feature_type}" hoort niet in ${t}.geojson.`, "feature_type", t);
      if (!isObj(f.properties)) { add("*", "FileMustBeValidGeoJSON", f.id, `${where}: properties ontbreekt of is geen object.`, "properties", t); f.properties = {}; }
      checkGeoJSONGeometry(t, f, where);
      byType[t].push(f);
    });
  }
  function checkGeoJSONGeometry(t, f, where) {
    const g = f.geometry; if (g == null) return;
    const bad = m => add("*", "FileMustBeValidGeoJSON", f.id, `${m}`, "geometry", t);
    const pos = p => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite);
    const range = p => p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90;
    const line = (c, min, ring) => {
      if (!Array.isArray(c) || !c.every(pos)) return bad(`Ongeldige coördinaten in ${g.type}.`);
      if (!c.every(range)) return bad(`Coördinaten buiten WGS84-bereik (lengte −180…180, breedte −90…90).`);
      if (c.length < min) return bad(`${ring ? "Ring" : "Lijn"} heeft ${c.length} punten (minimaal ${min}).`);
      if (ring && (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1])) return bad(`Ring is niet gesloten (eerste en laatste punt verschillen).`);
      for (let i = 1; i < c.length; i++) if (c[i][0] === c[i - 1][0] && c[i][1] === c[i - 1][1]) return bad(`Twee opeenvolgende punten met dezelfde coördinaten (${c[i].join(", ")}).`);
    };
    switch (g.type) {
      case "Point": if (!pos(g.coordinates)) bad("Ongeldige Point-coördinaten."); else if (!range(g.coordinates)) bad("Point buiten WGS84-bereik."); break;
      case "LineString": line(g.coordinates, 2); break;
      case "MultiLineString": (g.coordinates || []).forEach(l => line(l, 2)); break;
      case "Polygon": (g.coordinates || []).forEach(r => line(r, 4, true)); break;
      case "MultiPolygon": (g.coordinates || []).forEach(p => (p || []).forEach(r => line(r, 4, true))); break;
      default: if (g.type !== "GeometryCollection") bad(`Onbekend geometrietype "${g.type}".`);
    }
  }
  const venues = byType.venue;
  if (venues.length !== 1) add("*", "VenueCountMustBeExactlyOne", null, `Archief bevat ${venues.length} venues (precies 1 vereist).`, null, "*");

  // ---------- Manifest ----------
  mark("manifest", "ManifestVersionMustBeValid");
  if (data.manifest && data.manifest.version !== "1.0.0") add("manifest", "ManifestVersionMustBeValid", null, `Versie is ${str(data.manifest.version)}; alleen "1.0.0" is toegestaan.`, "version", "*");

  // ---------- Verwijzingen ----------
  const get = (id, type) => { const f = byId.get(id); return f && (!type || f.feature_type === type) ? f : null; };
  const REFS = { address_id: "address", level_id: "level", unit_id: "unit", anchor_id: "anchor", unit_ids: "unit", building_ids: "building", level_ids: "level" };
  for (const t of IMDF_TYPES) for (const f of byType[t]) {
    const p = f.properties;
    for (const [k, rt] of Object.entries(REFS)) {
      if (p[k] == null) continue;
      const ids = Array.isArray(p[k]) ? p[k] : [p[k]];
      for (const id of ids) if (typeof id !== "string" || !get(id, rt)) add("*", "ReferencedFeatureIDMustBeResolvable", f.id, `${k} verwijst naar ${str(id)}, maar er is geen ${rt} met dat id.`, k, t);
    }
    if (Array.isArray(p.parents)) for (const id of p.parents) if (!get(id, t)) add("*", "ReferencedFeatureIDMustBeResolvable", f.id, `parents verwijst naar ${str(id)}, maar er is geen ${t} met dat id.`, "parents", t);
  }
  // Indexen
  const levelOf = f => get(f?.properties?.level_id, "level");
  const unitsByLevel = new Map();   // ruimtelijke index per verdieping (grid op bbox)
  for (const u of byType.unit) { const l = u.properties.level_id; if (!l || !u.geometry) continue; (unitsByLevel.get(l) || unitsByLevel.set(l, []).get(l)).push({ f: u, b: bboxOf(u.geometry) }); }
  const unitsAt = (p, levelId) => (unitsByLevel.get(levelId) || []).filter(x => p[0] >= x.b[0] && p[0] <= x.b[2] && p[1] >= x.b[1] && p[1] <= x.b[3] && ptInGeom(p, x.f.geometry)).map(x => x.f);
  const STRUCTURAL = new Set(["brick", "column", "concrete", "drywall", "glass", "structure", "wood"]);

  // ---------- Gemeenschappelijke controles per feature ----------
  const GEOMRULE = { Polygon: "PolygonalGeometry", Point: "PointGeometry", LineString: "LineStringGeometry", MultiLineString: "LinealGeometry" };
  function common(t, f) {
    const p = f.properties, T = F(t);
    mark(t, "InvalidFeatureID");
    if (typeof f.id === "string" && !UUID4.test(f.id)) add(t, "InvalidFeatureID", f.id, `id ${str(f.id)} is geen geldige UUID versie 4.`, "id");
    // Geometrietype
    const allowed = IMDF_GEOM[t];
    const gr = t === "detail" ? "LinealGeometry" : t === "opening" ? "LineStringGeometry" : allowed.includes("Polygon") ? "PolygonalGeometry" : allowed.includes("Point") ? "PointGeometry" : null;
    if (gr) { mark(t, `${T}MustHave${gr}`); if (!allowed.includes(f.geometry?.type ?? null)) add(t, `${T}MustHave${gr}`, f.id, `Geometrie is ${f.geometry ? f.geometry.type : "null"}; verwacht ${allowed.filter(Boolean).join(" of ")}.`, "geometry"); }
    if (t === "relationship") { mark(t, "RelationshipHasGeometry"); if (f.geometry) add(t, "RelationshipHasGeometry", f.id, `Relationship heeft een geometrie (${f.geometry.type}).`, "geometry"); }
    // Labels (regels gelden als gecontroleerd, ook als een feature geen labels heeft)
    mark(t, "NameMustBeString", "AltNameMustBeString", "InvalidLanguageTag", "LabelMustNotBeBlank");
    for (const k of ["name", "alt_name", "short_name"]) {
      if (!(k in p) || p[k] == null) continue;
      const strRule = k === "alt_name" ? "AltNameMustBeString" : "NameMustBeString";
      mark(t, strRule, "InvalidLanguageTag", "LabelMustNotBeBlank");
      if (!isObj(p[k])) { add(t, strRule, f.id, `${k} is geen LABELS-object met taal → tekst (${str(p[k])}).`, k); continue; }
      for (const [tag, v] of Object.entries(p[k])) {
        if (!langOk(tag)) add(t, "InvalidLanguageTag", f.id, `${k}: ongeldige taalcode ${str(tag)}.`, k);
        if (typeof v !== "string") add(t, strRule, f.id, `${k}.${tag} is geen string (${str(v)}).`, k);
        else if (blank(v)) add(t, "LabelMustNotBeBlank", f.id, `${k}.${tag} is leeg of heeft spaties aan begin/eind (${str(v)}).`, k);
      }
    }
    mark(t, "HasOnlyAltName", "AltNameLangTagHasNoCorrespondingNameLangTag");
    if (isObj(p.alt_name) && p.name == null) add(t, "HasOnlyAltName", f.id, `alt_name is gevuld maar name is leeg.`, "alt_name");
    if (isObj(p.alt_name) && isObj(p.name)) for (const tag of Object.keys(p.alt_name)) if (!(tag in p.name)) add(t, "AltNameLangTagHasNoCorrespondingNameLangTag", f.id, `alt_name heeft taal "${tag}", name niet.`, "alt_name");
    // Categorie
    if (IMDF_ENUMS[t]) {
      mark(t, `${T}MustHaveCategory`, `${T}CategoryMustBeValid`);
      if (p.category == null || p.category === "") add(t, `${T}MustHaveCategory`, f.id, `category ontbreekt.`, "category");
      else if (!IMDF_ENUMS[t].has(p.category)) add(t, `${T}CategoryMustBeValid`, f.id, `category ${str(p.category)} is geen geldige ${t}-categorie.`, "category");
    }
    if ("restriction" in p) { mark(t, "RestrictionCategoryMustBeValid"); if (p.restriction != null && !IMDF_ENUMS.restriction.has(p.restriction)) add(t, "RestrictionCategoryMustBeValid", f.id, `restriction ${str(p.restriction)} is ongeldig.`, "restriction"); }
    if ("accessibility" in p) { mark(t, "AccessibilityMustBeValid"); if (p.accessibility != null && (!Array.isArray(p.accessibility) || p.accessibility.some(a => !IMDF_ENUMS.accessibility.has(a))))
      add(t, "AccessibilityMustBeValid", f.id, `accessibility ${str(p.accessibility)} bevat ongeldige waarden.`, "accessibility"); }
    // display_point
    if ("display_point" in p) {
      mark(t, "DisplayPointMustBePointGeometry", `${T}GeometryMustContainDisplayPoint`);
      if (p.display_point != null) {
        if (!isPoint(p.display_point)) add(t, "DisplayPointMustBePointGeometry", f.id, `display_point is geen geldig Point.`, "display_point");
        else if (f.geometry && /Polygon/.test(f.geometry.type) && !ptInGeom(p.display_point.coordinates, f.geometry))
          add(t, `${T}GeometryMustContainDisplayPoint`, f.id, `display_point ligt buiten de geometrie.`, "display_point");
      }
    }
    // Binnenringen
    const ir = t === "venue" ? "VenueGeometryShouldNotHaveInteriorRing" : `${T}HasInteriorRing`;
    if (rule(t, ir)) { mark(t, ir); if (hasInterior(f.geometry)) add(t, ir, f.id, `Geometrie heeft een binnenring (gat).`, "geometry"); }
    // level_id
    if (rule(t, `${T}MustReferenceLevel`)) { mark(t, `${T}MustReferenceLevel`); if (!levelOf(f)) add(t, `${T}MustReferenceLevel`, f.id, `level_id ${str(p.level_id)} verwijst niet naar een level.`, "level_id"); }
    // Contactgegevens
    if ("phone" in p) { mark(t, "PhoneMustBeValid"); if (p.phone != null && !/^\+[1-9]\d{1,14}( ?(x|ext\.?) ?\d{1,6})?$/.test(p.phone)) add(t, "PhoneMustBeValid", f.id, `phone ${str(p.phone)} is geen E.164-nummer (bijv. +31201234567).`, "phone"); }
    if ("website" in p) { mark(t, "WebsiteMustBeValid"); if (p.website != null) { let ok = false; try { const u = new URL(p.website); ok = /^https?:$/.test(u.protocol) && !!u.hostname; } catch {} if (!ok) add(t, "WebsiteMustBeValid", f.id, `website ${str(p.website)} is geen geldige http(s)-URL.`, "website"); } }
    if ("hours" in p) { mark(t, "HoursMustNotBeBlank"); if (p.hours != null && (typeof p.hours !== "string" || p.hours.trim() === "")) add(t, "HoursMustNotBeBlank", f.id, `hours is leeg.`, "hours"); }
    if ("correlation_id" in p) { mark(t, "InvalidCorrelationID"); if (p.correlation_id != null && !(typeof p.correlation_id === "string" && UUID4.test(p.correlation_id))) add(t, "InvalidCorrelationID", f.id, `correlation_id ${str(p.correlation_id)} is geen UUID versie 4.`, "correlation_id"); }
  }
  // correlation_id over features van hetzelfde type
  function correlation(t) {
    mark(t, "CorrelationIdMustBeMatched", "CategoryShouldBeSameForCorrelationID", "LevelIDsMustBeDissimilarForCorrelationID");
    const groups = new Map();
    for (const f of byType[t]) { const c = f.properties.correlation_id; if (typeof c === "string") (groups.get(c) || groups.set(c, []).get(c)).push(f); }
    for (const [c, g] of groups) {
      if (g.length < 2) { add(t, "CorrelationIdMustBeMatched", g[0].id, `correlation_id ${c} komt bij geen ander ${t} voor.`, "correlation_id"); continue; }
      if (new Set(g.map(f => f.properties.category)).size > 1) g.forEach(f => add(t, "CategoryShouldBeSameForCorrelationID", f.id, `Features met correlation_id ${c} hebben verschillende categorieën.`, "category"));
      const lv = f => t === "amenity" ? (f.properties.unit_ids || []).map(u => get(u)?.properties.level_id).sort().join() : t === "occupant" ? get(get(f.properties.anchor_id)?.properties.unit_id)?.properties.level_id : f.properties.level_id;
      const seen = new Map(); for (const f of g) { const k = lv(f); if (k && seen.has(k)) add(t, "LevelIDsMustBeDissimilarForCorrelationID", f.id, `Zelfde correlation_id en zelfde level als ${seen.get(k)}.`, "correlation_id"); else seen.set(k, f.id); }
    }
  }
  for (const t of IMDF_TYPES) for (const f of byType[t]) common(t, f);
  for (const t of ["amenity", "geofence", "occupant", "section"]) correlation(t);

  // ---------- Address ----------
  {
    const t = "address";
    mark(t, "AddressMustHaveAddressLine", "AddressMustHaveCountryCode", "AddressMustHaveLocality", "AddressUnitMustNotBeBlank", "InvalidCountryCode", "InvalidIsoProvinceCode",
      "InvalidISOCountryAndISOProvinceCodeCombination", "PostalCodeMustNotBeBlank", "PostalCodeExtensionMustNotBeBlank", "VanityPostalCodeMustNotBeBlank",
      "AddressShouldHavePostalCode", "AddressMustBeReferenced", "AddressMustBeDistinct", "AddressHasDissimilarProvinceCode");
    const referenced = new Set();
    for (const tt of IMDF_TYPES) for (const f of byType[tt]) if (typeof f.properties.address_id === "string") referenced.add(f.properties.address_id);
    const seen = new Map(), provinces = new Map();
    for (const f of byType.address) {
      const p = f.properties;
      if (typeof p.address !== "string" || !p.address.trim()) add(t, "AddressMustHaveAddressLine", f.id, `address (adresregel) ontbreekt.`, "address");
      if (typeof p.locality !== "string" || !p.locality.trim()) add(t, "AddressMustHaveLocality", f.id, `locality ontbreekt.`, "locality");
      if (p.country == null || p.country === "") add(t, "AddressMustHaveCountryCode", f.id, `country ontbreekt.`, "country");
      else if (!/^[A-Z]{2}$/.test(p.country) || regionName(p.country) === p.country || !regionName(p.country)) add(t, "InvalidCountryCode", f.id, `country ${str(p.country)} is geen ISO 3166-1-landcode.`, "country");
      if (p.province != null) {
        if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(p.province)) add(t, "InvalidIsoProvinceCode", f.id, `province ${str(p.province)} heeft niet de vorm van een ISO 3166-2-code (bijv. NL-NH).`, "province");
        else if (p.country && p.province.slice(0, 2) !== p.country) add(t, "InvalidISOCountryAndISOProvinceCodeCombination", f.id, `province ${p.province} hoort niet bij country ${p.country}.`, "province");
        provinces.set(p.province, (provinces.get(p.province) || 0) + 1);
      }
      if (blank(p.unit)) add(t, "AddressUnitMustNotBeBlank", f.id, `unit is leeg.`, "unit");
      if (blank(p.postal_code)) add(t, "PostalCodeMustNotBeBlank", f.id, `postal_code is leeg.`, "postal_code");
      if (blank(p.postal_code_ext)) add(t, "PostalCodeExtensionMustNotBeBlank", f.id, `postal_code_ext is leeg.`, "postal_code_ext");
      if (blank(p.postal_code_vanity)) add(t, "VanityPostalCodeMustNotBeBlank", f.id, `postal_code_vanity is leeg.`, "postal_code_vanity");
      if (p.postal_code == null) add(t, "AddressShouldHavePostalCode", f.id, `postal_code ontbreekt.`, "postal_code");
      if (!referenced.has(f.id)) add(t, "AddressMustBeReferenced", f.id, `Geen enkel feature verwijst naar dit adres.`);
      const k = JSON.stringify([p.address, p.unit, p.locality, p.province, p.country, p.postal_code, p.postal_code_ext]);
      if (seen.has(k)) add(t, "AddressMustBeDistinct", f.id, `Zelfde adres als ${seen.get(k)}.`); else seen.set(k, f.id);
    }
    if (provinces.size > 1) { const main = [...provinces].sort((a, b) => b[1] - a[1])[0][0];
      for (const f of byType.address) if (f.properties.province && f.properties.province !== main) add(t, "AddressHasDissimilarProvinceCode", f.id, `province ${f.properties.province} wijkt af van de meeste adressen (${main}).`, "province"); }
    if (!byType.address.some(a => a.properties.unit != null)) add("*", "ZeroCountOfUnitQualifiedAddresses", null, `Geen enkel adres heeft een unit (unit-gekwalificeerd adres).`, null, "*");
  }

  // ---------- Venue ----------
  {
    const t = "venue";
    mark(t, "VenueMustHaveAddress", "VenueMustHaveAtLeastOneBuilding", "VenueMustHaveName", "VenueHasNoDisplayPoint", "VenueShouldHaveHours", "VenueShouldHavePhone", "VenueShouldHaveWebsite");
    for (const f of venues) {
      const p = f.properties;
      if (!get(p.address_id, "address")) add(t, "VenueMustHaveAddress", f.id, `address_id ontbreekt of verwijst niet naar een adres.`, "address_id");
      if (!byType.building.length) add(t, "VenueMustHaveAtLeastOneBuilding", f.id, `Het archief bevat geen building.`);
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "VenueMustHaveName", f.id, `name ontbreekt.`, "name");
      if (p.display_point == null) add(t, "VenueHasNoDisplayPoint", f.id, `display_point ontbreekt.`, "display_point");
      if (p.hours == null) add(t, "VenueShouldHaveHours", f.id, `hours ontbreekt.`, "hours");
      if (p.phone == null) add(t, "VenueShouldHavePhone", f.id, `phone ontbreekt.`, "phone");
      if (p.website == null) add(t, "VenueShouldHaveWebsite", f.id, `website ontbreekt.`, "website");
    }
  }

  // ---------- Building ----------
  {
    const t = "building";
    mark(t, "BuildingHasNoLevel", "BuildingMustHaveAtLeastOneFootprint", "BuildingHasNoAddress", "BuildingHasNoDisplayPoint", "BuildingHasNoName",
      "BuildingHasNoGroundFootprint", "BuildingHasNoAerialFootprint", "BuildingHasNoSubterraneanFootprint", "BuildingLevelOrdinalZeroShouldBePresent",
      "BuildingNameIsNotDistinct", "BuildingAltNameShouldBeDistinct", "LevelNamesInBuildingShouldBeDistinct", "LevelShortNamesInBuildingShouldBeDistinct",
      "LevelOrdinalsForBuildingAreNotSequential", "BuildingsHaveSameAddress", "BuildingAddressResolvesToVenueAddress", "BuildingCategoryShouldBeParking",
      "ParkingBuildingReferencingNonParkingLevel", "NonMatchingNameLangTagsAmongLevelsReferencingSameBuilding",
      "NonMatchingShortNameLangTagsAmongLevelsReferencingSameBuilding", "BuildingFootprintGeometryMustContainDisplayPoint", "BuildingReferencesUnitQualifiedAddress");
    const venueAddr = venues[0]?.properties.address_id;
    const names = new Map(), alts = new Map(), addrs = new Map();
    for (const b of byType.building) {
      const p = b.properties;
      const lv = byType.level.filter(l => (l.properties.building_ids || []).includes(b.id));
      const fp = byType.footprint.filter(x => (x.properties.building_ids || []).includes(b.id));
      if (!lv.length) add(t, "BuildingHasNoLevel", b.id, `Geen enkel level verwijst naar deze building.`);
      if (!fp.length) add(t, "BuildingMustHaveAtLeastOneFootprint", b.id, `Geen enkele footprint verwijst naar deze building.`);
      else {
        const cats = new Set(fp.map(x => x.properties.category));
        if (!cats.has("ground")) add(t, "BuildingHasNoGroundFootprint", b.id, `Geen ground-footprint.`);
        if (!cats.has("aerial")) add(t, "BuildingHasNoAerialFootprint", b.id, `Geen aerial-footprint.`);
        if (!cats.has("subterranean") && lv.some(l => l.properties.ordinal < 0)) add(t, "BuildingHasNoSubterraneanFootprint", b.id, `Er zijn levels met negatieve ordinal, maar geen subterranean-footprint.`);
        if (isPoint(p.display_point) && !fp.some(x => ptInGeom(p.display_point.coordinates, x.geometry))) add(t, "BuildingFootprintGeometryMustContainDisplayPoint", b.id, `display_point ligt in geen enkele footprint van deze building.`, "display_point");
      }
      if (p.address_id == null) add(t, "BuildingHasNoAddress", b.id, `address_id ontbreekt.`, "address_id");
      else {
        if (p.address_id === venueAddr) add(t, "BuildingAddressResolvesToVenueAddress", b.id, `Building en venue delen hetzelfde adres.`, "address_id");
        if (get(p.address_id)?.properties.unit != null) add(t, "BuildingReferencesUnitQualifiedAddress", b.id, `Het adres van de building heeft een unit.`, "address_id");
        if (addrs.has(p.address_id)) add(t, "BuildingsHaveSameAddress", b.id, `Zelfde adres als building ${addrs.get(p.address_id)}.`, "address_id"); else addrs.set(p.address_id, b.id);
      }
      if (p.display_point == null) add(t, "BuildingHasNoDisplayPoint", b.id, `display_point ontbreekt.`, "display_point");
      if (p.name == null) add(t, "BuildingHasNoName", b.id, `name ontbreekt.`, "name");
      else { const k = JSON.stringify(p.name); if (names.has(k)) add(t, "BuildingNameIsNotDistinct", b.id, `Zelfde naam als building ${names.get(k)} (${lbl(p.name)}).`, "name"); else names.set(k, b.id); }
      if (p.alt_name != null) { const k = JSON.stringify(p.alt_name); if (alts.has(k)) add(t, "BuildingAltNameShouldBeDistinct", b.id, `Zelfde alt_name als building ${alts.get(k)}.`, "alt_name"); else alts.set(k, b.id); }
      if (lv.length) {
        const ords = [...new Set(lv.map(l => l.properties.ordinal).filter(Number.isInteger))].sort((a, c) => a - c);
        if (!ords.includes(0)) add(t, "BuildingLevelOrdinalZeroShouldBePresent", b.id, `Geen level met ordinal 0 verwijst naar deze building.`);
        for (let i = 1; i < ords.length; i++) if (ords[i] - ords[i - 1] > 1) { add(t, "LevelOrdinalsForBuildingAreNotSequential", b.id, `Ordinals ${ords.join(", ")} lopen niet aaneen (gat tussen ${ords[i - 1]} en ${ords[i]}).`); break; }
        const dup = (key, r, what) => { const m = new Map(); for (const l of lv) { if (l.properties.outdoor) continue; const v = l.properties[key]; if (v == null) continue; const k = JSON.stringify(v) + "@" + l.properties.ordinal;
          const kk = JSON.stringify(v); if (m.has(kk) && m.get(kk).ord !== l.properties.ordinal) add(t, r, b.id, `${what} ${lbl(v)} komt voor bij ordinal ${m.get(kk).ord} en ${l.properties.ordinal}.`); else if (!m.has(kk)) m.set(kk, { ord: l.properties.ordinal, k }); } };
        dup("name", "LevelNamesInBuildingShouldBeDistinct", "Levelnaam");
        dup("short_name", "LevelShortNamesInBuildingShouldBeDistinct", "Level short_name");
        const tags = key => new Set(lv.map(l => isObj(l.properties[key]) ? Object.keys(l.properties[key]).sort().join(",") : null).filter(x => x != null));
        if (tags("name").size > 1) add(t, "NonMatchingNameLangTagsAmongLevelsReferencingSameBuilding", b.id, `Levels van deze building gebruiken verschillende talen in name: ${[...tags("name")].map(x => "[" + x + "]").join(" ")}.`);
        if (tags("short_name").size > 1) add(t, "NonMatchingShortNameLangTagsAmongLevelsReferencingSameBuilding", b.id, `Levels van deze building gebruiken verschillende talen in short_name: ${[...tags("short_name")].map(x => "[" + x + "]").join(" ")}.`);
        const parkingLv = lv.filter(l => l.properties.category === "parking");
        if (parkingLv.length === lv.length && p.category !== "parking") add(t, "BuildingCategoryShouldBeParking", b.id, `Alle levels zijn parking, maar category is ${str(p.category)}.`, "category");
        if (p.category === "parking" && parkingLv.length < lv.length) add(t, "ParkingBuildingReferencingNonParkingLevel", b.id, `Parking-building heeft ${lv.length - parkingLv.length} level(s) die geen parking zijn.`, "category");
      }
    }
  }

  // ---------- Footprint ----------
  { const t = "footprint"; mark(t, "FootprintMustReferenceBuilding");
    for (const f of byType.footprint) { const ids = f.properties.building_ids;
      if (!Array.isArray(ids) || !ids.length || ids.some(id => !get(id, "building")) || new Set(ids).size !== ids.length) add(t, "FootprintMustReferenceBuilding", f.id, `building_ids moet een niet-lege lijst van bestaande buildings zonder dubbelen zijn (${str(ids)}).`, "building_ids"); } }

  // ---------- Level ----------
  {
    const t = "level";
    mark(t, "LevelMustHaveName", "LevelMustHaveShortName", "LevelMustHaveOrdinal", "LevelOrdinalMustBeInteger", "LevelMustBeReferencedByUnit", "LevelHasSuspiciousOrdinal",
      "OutdoorLevelHasBuildingReference", "IndoorLevelMustHaveBuildingReference", "OutdoorLevelHasNegativeOrdinal", "OutdoorLevelShouldReferenceBuilding",
      "LevelShouldBeReferencedByOpening", "ParkingLevelShouldContainParkingUnit", "ParkingUnitShouldBeContainedByParkingLevel", "ParkingUnitIsNotContainedByParkingLevel",
      "ParkingLevelShouldHaveAutomobileOpening");
    const unitsOn = new Map(), openOn = new Map();
    for (const u of byType.unit) (unitsOn.get(u.properties.level_id) || unitsOn.set(u.properties.level_id, []).get(u.properties.level_id)).push(u);
    for (const o of byType.opening) (openOn.get(o.properties.level_id) || openOn.set(o.properties.level_id, []).get(o.properties.level_id)).push(o);
    for (const l of byType.level) {
      const p = l.properties, us = unitsOn.get(l.id) || [], os = openOn.get(l.id) || [];
      const hasB = Array.isArray(p.building_ids) && p.building_ids.length > 0;
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "LevelMustHaveName", l.id, `name ontbreekt.`, "name");
      if (!isObj(p.short_name) || !Object.keys(p.short_name).length) add(t, "LevelMustHaveShortName", l.id, `short_name ontbreekt.`, "short_name");
      if (p.ordinal == null) add(t, "LevelMustHaveOrdinal", l.id, `ordinal ontbreekt.`, "ordinal");
      else if (!Number.isInteger(p.ordinal)) add(t, "LevelOrdinalMustBeInteger", l.id, `ordinal ${str(p.ordinal)} is geen geheel getal.`, "ordinal");
      else if (p.ordinal < -12 || p.ordinal > 163) add(t, "LevelHasSuspiciousOrdinal", l.id, `ordinal ${p.ordinal} valt buiten het gebruikelijke bereik (−12 t/m 163).`, "ordinal");
      if (!us.length) add(t, "LevelMustBeReferencedByUnit", l.id, `Geen enkele unit verwijst naar dit level.`);
      if (p.outdoor === true && p.ordinal === 0 && hasB) add(t, "OutdoorLevelHasBuildingReference", l.id, `Buiten-level op ordinal 0 verwijst naar een building.`, "building_ids");
      if (p.outdoor === false && !hasB) add(t, "IndoorLevelMustHaveBuildingReference", l.id, `Binnen-level verwijst niet naar een building.`, "building_ids");
      if (p.outdoor === true && p.ordinal < 0) add(t, "OutdoorLevelHasNegativeOrdinal", l.id, `Buiten-level heeft negatieve ordinal ${p.ordinal}.`, "ordinal");
      if (p.outdoor === true && p.ordinal !== 0 && !hasB) add(t, "OutdoorLevelShouldReferenceBuilding", l.id, `Buiten-level op ordinal ${p.ordinal} verwijst niet naar een building.`, "building_ids");
      if (!os.length && byType.opening.length) add(t, "LevelShouldBeReferencedByOpening", l.id, `Geen enkele opening verwijst naar dit level.`);
      else if (!byType.opening.length) add(t, "LevelShouldBeReferencedByOpening", l.id, `Geen enkele opening verwijst naar dit level (het archief bevat geen openings).`);
      const parkingUnits = us.filter(u => u.properties.category === "parking");
      if (p.category === "parking") {
        if (!parkingUnits.length) add(t, "ParkingLevelShouldContainParkingUnit", l.id, `Parking-level zonder parking-unit.`);
        if (!os.some(o => o.properties.category === "automobile")) add(t, "ParkingLevelShouldHaveAutomobileOpening", l.id, `Parking-level zonder automobile-opening.`);
      } else if (parkingUnits.length) {
        if (parkingUnits.length === us.length) add(t, "ParkingUnitShouldBeContainedByParkingLevel", l.id, `Level bevat alleen parking-units maar is geen parking-level (category ${str(p.category)}).`, "category");
        else if (us.some(u => u.properties.category !== "parking" && !["office", "platform", "room", "unenclosedarea"].includes(u.properties.category)))
          add(t, "ParkingUnitIsNotContainedByParkingLevel", l.id, `${parkingUnits.length} parking-unit(s) op een level dat geen parking-level is.`, "category");
      }
    }
  }

  // ---------- Opening ----------
  {
    const t = "opening";
    mark(t, "AccessControlMustBeValid", "OpeningDoorTypeMustBeValid", "OpeningDoorMaterialMustBeValid", "OpeningIsSuspiciouslyLarge", "OpeningIsSuspiciouslySmall");
    for (const o of byType.opening) {
      const p = o.properties;
      if (p.access_control != null && (!Array.isArray(p.access_control) || p.access_control.some(a => !IMDF_ENUMS.accesscontrol.has(a)))) add(t, "AccessControlMustBeValid", o.id, `access_control ${str(p.access_control)} bevat ongeldige waarden.`, "access_control");
      if (isObj(p.door)) {
        if (p.door.type != null && !IMDF_ENUMS.doortype.has(p.door.type)) add(t, "OpeningDoorTypeMustBeValid", o.id, `door.type ${str(p.door.type)} is ongeldig.`, "door");
        if (p.door.material != null && !IMDF_ENUMS.doormaterial.has(p.door.material)) add(t, "OpeningDoorMaterialMustBeValid", o.id, `door.material ${str(p.door.material)} is ongeldig.`, "door");
      }
      if (o.geometry?.type === "LineString") { const len = lineLen(o.geometry.coordinates);
        if (len > 45) add(t, "OpeningIsSuspiciouslyLarge", o.id, `Opening is ${len.toFixed(1)} m lang (meer dan 45 m).`, "geometry");
        if (len < 0.8382) add(t, "OpeningIsSuspiciouslySmall", o.id, `Opening is ${len.toFixed(2)} m lang (minder dan 0,8382 m).`, "geometry"); }
    }
  }

  // ---------- Unit-inhoud (amenity, anchor) ----------
  const containing = (pt, levelIds) => levelIds.flatMap(l => unitsAt(pt, l));
  // ---------- Amenity ----------
  {
    const t = "amenity";
    mark(t, "AmenityMustReferenceUnit", "AmenityShouldBeCoveredByReferencedUnit", "AmenityShouldNotEqualAmenity", "AmenityNameAndCategoryAreSame", "AmenityNameShouldNotBeDuplicate",
      "AircraftBoardingGateAmenityShouldHaveName", "ArrivalGateAmenityShouldHaveName", "BusBoardingGateAmenityShouldHaveName", "TrainBoardingGateAmenityShouldHaveName",
      "BaggageCarouselAmenityShouldHaveName", "BaggageCarouselAmenityNameIsDuplicateInSameBuilding", "UnspecifiedAmenityShouldHaveName",
      "ElevatorUnitMayOnlyContainElevatorAmenity", "EscalatorUnitMayOnlyContainEscalatorAmenity", "MovingWalkwayUnitMayOnlyContainMovingWalkwayAmenity",
      "StairsUnitMayOnlyContainStairsAmenity", "OpenToBelowUnitMustNotContainAmenity", "StepsUnitMustNotContainAmenity", "StructuralUnitMustNotContainAmenity",
      "FemaleRestroomUnitMustNotContainRestroomAmenityCategory", "MaleRestroomUnitMustNotContainRestroomAmenityCategory", "RestroomUnitMayOnlyContainAmenityFromRestroomHierarchy",
      "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", "GenericRestroomUnitCategoryContainsSpecificRestroomAmenityCategory", "KioskMustNotContainAmenityCategory");
    const NAMED = { "boardinggate.aircraft": "AircraftBoardingGateAmenityShouldHaveName", "arrivalgate": "ArrivalGateAmenityShouldHaveName",
      "boardinggate.bus": "BusBoardingGateAmenityShouldHaveName", "boardinggate.train": "TrainBoardingGateAmenityShouldHaveName",
      "baggagecarousel": "BaggageCarouselAmenityShouldHaveName", "unspecified": "UnspecifiedAmenityShouldHaveName" };
    const coinc = new Map(), dupNames = new Map(), carousel = new Map();
    const kiosksByLevel = new Map(); for (const k of byType.kiosk) (kiosksByLevel.get(k.properties.level_id) || kiosksByLevel.set(k.properties.level_id, []).get(k.properties.level_id)).push(k);
    for (const a of byType.amenity) {
      const p = a.properties, cat = p.category || "";
      const units = Array.isArray(p.unit_ids) ? p.unit_ids.map(id => get(id, "unit")).filter(Boolean) : [];
      if (!Array.isArray(p.unit_ids) || !p.unit_ids.length || units.length !== p.unit_ids.length) add(t, "AmenityMustReferenceUnit", a.id, `unit_ids moet naar minstens één bestaande unit verwijzen (${str(p.unit_ids)}).`, "unit_ids");
      const pt = isPoint(a.geometry) ? a.geometry.coordinates : null;
      if (pt) for (const u of units) if (u.geometry && !ptInGeom(pt, u.geometry)) add(t, "AmenityShouldBeCoveredByReferencedUnit", a.id, `Ligt buiten de verwezen unit ${u.id}.`, "unit_ids");
      if (NAMED[cat] && p.name == null) add(t, NAMED[cat], a.id, `Amenity met categorie ${cat} heeft geen naam.`, "name");
      if (isObj(p.name) && Object.values(p.name).some(v => typeof v === "string" && (v.toLowerCase() === cat.toLowerCase() || v.toLowerCase() === cat.replace(/\./g, " ").toLowerCase())))
        add(t, "AmenityNameAndCategoryAreSame", a.id, `Naam is gelijk aan de categorie (${cat}).`, "name");
      const levelIds = [...new Set(units.map(u => u.properties.level_id).filter(Boolean))];
      if (pt) for (const l of levelIds) { const k = l + "|" + pt.join(","); if (coinc.has(k)) add(t, "AmenityShouldNotEqualAmenity", a.id, `Zelfde locatie op hetzelfde level als amenity ${coinc.get(k)}.`, "geometry"); else coinc.set(k, a.id); }
      if (["arrivalgate", "boardinggate.aircraft", "boardinggate.bus", "boardinggate.train"].includes(cat) && isObj(p.name)) {
        const k = cat + "|" + JSON.stringify(p.name); if (dupNames.has(k)) add(t, "AmenityNameShouldNotBeDuplicate", a.id, `Naam ${lbl(p.name)} komt al voor bij ${cat}-amenity ${dupNames.get(k)}.`, "name"); else dupNames.set(k, a.id); }
      if (cat === "baggagecarousel" && isObj(p.name)) for (const u of units) for (const b of (get(u.properties.level_id)?.properties.building_ids || [])) {
        const k = b + "|" + JSON.stringify(p.name); if (carousel.has(k) && carousel.get(k) !== a.id) add(t, "BaggageCarouselAmenityNameIsDuplicateInSameBuilding", a.id, `Naam ${lbl(p.name)} komt al voor bij bagageband ${carousel.get(k)} in dezelfde building.`, "name"); else carousel.set(k, a.id); }
      if (!pt) continue;
      // Units waarin het punt ligt (op de levels van de verwezen units)
      for (const u of containing(pt, levelIds)) {
        const uc = u.properties.category || "";
        const only = { elevator: "ElevatorUnitMayOnlyContainElevatorAmenity", escalator: "EscalatorUnitMayOnlyContainEscalatorAmenity", movingwalkway: "MovingWalkwayUnitMayOnlyContainMovingWalkwayAmenity", stairs: "StairsUnitMayOnlyContainStairsAmenity" }[uc];
        if (only && cat !== uc) add(t, only, a.id, `Ligt in ${uc}-unit ${u.id}, maar is ${cat}.`, "category");
        if (uc === "opentobelow") add(t, "OpenToBelowUnitMustNotContainAmenity", a.id, `Ligt in een opentobelow-unit (${u.id}).`, "geometry");
        if (uc === "steps") add(t, "StepsUnitMustNotContainAmenity", a.id, `Ligt in een steps-unit (${u.id}).`, "geometry");
        if (STRUCTURAL.has(uc)) add(t, "StructuralUnitMustNotContainAmenity", a.id, `Ligt in een constructie-unit (${uc}, ${u.id}).`, "geometry");
        if (uc.startsWith("restroom")) {
          if (!cat.startsWith("restroom")) add(t, "RestroomUnitMayOnlyContainAmenityFromRestroomHierarchy", a.id, `Ligt in ${uc}-unit ${u.id}, maar is ${cat}.`, "category");
          else {
            // Letterlijk volgens de definitie: alleen family/male(female)/transgender/unisex (incl. .wheelchair-varianten)
            if (uc.startsWith("restroom.female") && /^restroom\.(family|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "FemaleRestroomUnitMustNotContainRestroomAmenityCategory", a.id, `${cat} in damestoilet-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.male") && /^restroom\.(family|female|transgender|unisex)(\.|$)/.test(cat)) add(t, "MaleRestroomUnitMustNotContainRestroomAmenityCategory", a.id, `${cat} in herentoilet-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.family") && /^restroom\.(female|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", a.id, `${cat} in ${uc}-unit ${u.id}.`, "category");
            if (uc.startsWith("restroom.unisex") && /^restroom\.(family|female|male|transgender)(\.|$)/.test(cat)) add(t, "RestroomUnitCategoryShouldNotContainRestroomAmenityCategory", a.id, `${cat} in ${uc}-unit ${u.id}.`, "category");
            if (uc === "restroom" && /^restroom\.(family|female|male|transgender|unisex)(\.|$)/.test(cat)) add(t, "GenericRestroomUnitCategoryContainsSpecificRestroomAmenityCategory", a.id, `${cat} in algemene restroom-unit ${u.id}.`, "category");
          }
        }
      }
      if (["elevator", "escalator", "movingwalkway", "stairs"].includes(cat)) for (const l of levelIds) for (const k of (kiosksByLevel.get(l) || []))
        if (ptInGeom(pt, k.geometry)) add(t, "KioskMustNotContainAmenityCategory", a.id, `${cat}-amenity ligt in kiosk ${k.id}.`, "geometry");
    }
  }

  // ---------- Anchor ----------
  {
    const t = "anchor";
    mark(t, "AnchorMustReferenceUnit", "AnchorMustBeCoveredByReferencedUnit", "AnchorShouldNotEqualAnchor", "OpenToBelowUnitMustNotContainAnchor", "StructuralUnitMustNotContainAnchor");
    const coinc = new Map();
    for (const a of byType.anchor) {
      const u = get(a.properties.unit_id, "unit");
      if (!u) { add(t, "AnchorMustReferenceUnit", a.id, `unit_id ${str(a.properties.unit_id)} verwijst niet naar een unit.`, "unit_id"); continue; }
      if (!isPoint(a.geometry)) continue;
      const pt = a.geometry.coordinates, l = u.properties.level_id;
      if (u.geometry && !ptInGeom(pt, u.geometry)) add(t, "AnchorMustBeCoveredByReferencedUnit", a.id, `Ligt buiten de verwezen unit ${u.id}.`, "unit_id");
      const k = l + "|" + pt.join(","); if (coinc.has(k)) add(t, "AnchorShouldNotEqualAnchor", a.id, `Zelfde locatie op hetzelfde level als anchor ${coinc.get(k)}.`, "geometry"); else coinc.set(k, a.id);
      for (const c of unitsAt(pt, l)) {
        if (c.properties.category === "opentobelow") add(t, "OpenToBelowUnitMustNotContainAnchor", a.id, `Ligt in een opentobelow-unit (${c.id}).`, "geometry");
        if (STRUCTURAL.has(c.properties.category)) add(t, "StructuralUnitMustNotContainAnchor", a.id, `Ligt in een constructie-unit (${c.properties.category}, ${c.id}).`, "geometry");
      }
    }
  }

  // ---------- Occupant ----------
  {
    const t = "occupant";
    mark(t, "OccupantMustHaveName", "OccupantMustReferenceAnchor", "OccupantShouldHaveHours", "OccupantShouldHavePhone", "OccupantShouldHaveWebsite", "OccupantShouldHaveModifiedTime",
      "EndDateTimeIsBeforeCurrentDateTime", "ModifiedDateTimeIsAfterCurrentDateTime", "StartDateTimeIsAfterEndDateTime", "SimilarOccupantsShouldNotRefSameAnchor");
    const sim = new Map();
    const dt = s => { if (typeof s !== "string") return null; const d = new Date(s); return isNaN(d) ? null : d; };
    for (const o of byType.occupant) {
      const p = o.properties;
      if (!isObj(p.name) || !Object.keys(p.name).length) add(t, "OccupantMustHaveName", o.id, `name ontbreekt.`, "name");
      if (!get(p.anchor_id, "anchor")) add(t, "OccupantMustReferenceAnchor", o.id, `anchor_id ${str(p.anchor_id)} verwijst niet naar een anchor.`, "anchor_id");
      if (p.hours == null) add(t, "OccupantShouldHaveHours", o.id, `hours ontbreekt.`, "hours");
      if (p.phone == null) add(t, "OccupantShouldHavePhone", o.id, `phone ontbreekt.`, "phone");
      if (p.website == null) add(t, "OccupantShouldHaveWebsite", o.id, `website ontbreekt.`, "website");
      const v = isObj(p.validity) ? p.validity : null;
      if (!v || v.modified == null) add(t, "OccupantShouldHaveModifiedTime", o.id, `validity.modified ontbreekt.`, "validity");
      if (v) {
        const s = dt(v.start), e = dt(v.end), m = dt(v.modified);
        if (e && e <= now) add(t, "EndDateTimeIsBeforeCurrentDateTime", o.id, `validity.end (${v.end}) ligt in het verleden.`, "validity");
        if (m && m > now) add(t, "ModifiedDateTimeIsAfterCurrentDateTime", o.id, `validity.modified (${v.modified}) ligt in de toekomst.`, "validity");
        if (s && e && s > e) add(t, "StartDateTimeIsAfterEndDateTime", o.id, `validity.start ligt na validity.end.`, "validity");
      }
      if (isObj(p.name) && p.anchor_id) for (const n of Object.values(p.name)) { if (typeof n !== "string") continue;
        const k = p.anchor_id + "|" + n.trim().toLowerCase(); if (sim.has(k)) add(t, "SimilarOccupantsShouldNotRefSameAnchor", o.id, `Occupant met dezelfde naam (${n}) verwijst naar dezelfde anchor als ${sim.get(k)}.`, "anchor_id"); else sim.set(k, o.id); }
    }
  }

  // ---------- Fixture / Kiosk ----------
  {
    const unitKeys = new Map(); for (const u of byType.unit) unitKeys.set(u.properties.level_id + "|" + geomKey(u.geometry), u.id);
    mark("fixture", "FixtureMustNotEqualFixture", "FixtureMustNotEqualUnit", "BaggageCarouselFixtureShouldHaveName", "FixtureMustContainReferencedAnchor", "BaggageCarouselFixtureShouldHaveDisplayPointAndName");
    const carouselPts = byType.amenity.filter(a => a.properties.category === "baggagecarousel" && isPoint(a.geometry)).map(a => a.geometry.coordinates);
    const fx = new Map();
    for (const f of byType.fixture) {
      const p = f.properties, k = p.level_id + "|" + geomKey(f.geometry);
      if (f.geometry) { if (fx.has(k)) add("fixture", "FixtureMustNotEqualFixture", f.id, `Zelfde geometrie op hetzelfde level als fixture ${fx.get(k)}.`, "geometry"); else fx.set(k, f.id);
        if (unitKeys.has(k)) add("fixture", "FixtureMustNotEqualUnit", f.id, `Zelfde geometrie als unit ${unitKeys.get(k)}.`, "geometry"); }
      if (p.category === "baggagecarousel" && p.name == null) add("fixture", "BaggageCarouselFixtureShouldHaveName", f.id, `Bagageband-fixture zonder naam.`, "name");
      if (p.category === "baggagecarousel" && (p.name == null || p.display_point == null) && f.geometry && !carouselPts.some(pt => ptInGeom(pt, f.geometry)))
        add("fixture", "BaggageCarouselFixtureShouldHaveDisplayPointAndName", f.id, `Bagageband-fixture zonder baggagecarousel-amenity mist ${[p.name == null && "name", p.display_point == null && "display_point"].filter(Boolean).join(" en ")}.`, p.name == null ? "name" : "display_point");
      const an = get(p.anchor_id, "anchor"); if (an && isPoint(an.geometry) && f.geometry && !ptInGeom(an.geometry.coordinates, f.geometry)) add("fixture", "FixtureMustContainReferencedAnchor", f.id, `Verwezen anchor ${an.id} ligt buiten de fixture.`, "anchor_id");
    }
    mark("kiosk", "KioskMustNotEqualUnit", "KioskMustContainReferencedAnchor", "KioskShouldHaveAnchorOrContainAmenity");
    for (const k of byType.kiosk) {
      const p = k.properties, key = p.level_id + "|" + geomKey(k.geometry);
      if (k.geometry && unitKeys.has(key)) add("kiosk", "KioskMustNotEqualUnit", k.id, `Zelfde geometrie als unit ${unitKeys.get(key)}.`, "geometry");
      const an = get(p.anchor_id, "anchor"); if (an && isPoint(an.geometry) && k.geometry && !ptInGeom(an.geometry.coordinates, k.geometry)) add("kiosk", "KioskMustContainReferencedAnchor", k.id, `Verwezen anchor ${an.id} ligt buiten de kiosk.`, "anchor_id");
      if (!an && !byType.amenity.some(a => isPoint(a.geometry) && ptInGeom(a.geometry.coordinates, k.geometry))) add("kiosk", "KioskShouldHaveAnchorOrContainAmenity", k.id, `Kiosk heeft geen anchor en bevat geen amenity.`);
    }
  }

  // ---------- Geofence / Section ----------
  {
    mark("geofence", "GeofenceMustHaveLevelOrBuildingReference", "GeofenceHasNoBuildingReference", "GeofenceHasNoLevelReference", "GeofenceHasParentReference");
    for (const g of byType.geofence) { const p = g.properties, b = Array.isArray(p.building_ids) && p.building_ids.length, l = Array.isArray(p.level_ids) && p.level_ids.length;
      if (!b && !l) add("geofence", "GeofenceMustHaveLevelOrBuildingReference", g.id, `Geen building_ids en geen level_ids.`);
      if (!b) add("geofence", "GeofenceHasNoBuildingReference", g.id, `Geen building_ids.`, "building_ids");
      if (!l) add("geofence", "GeofenceHasNoLevelReference", g.id, `Geen level_ids.`, "level_ids");
      if (Array.isArray(p.parents) && p.parents.length) add("geofence", "GeofenceHasParentReference", g.id, `Heeft parents (${p.parents.length}).`, "parents"); }
    mark("section", "SectionHasParentReference");
    for (const s of byType.section) if (Array.isArray(s.properties.parents) && s.properties.parents.length) add("section", "SectionHasParentReference", s.id, `Heeft parents (${s.properties.parents.length}).`, "parents");
  }

  // ---------- Relationship ----------
  {
    const t = "relationship";
    mark(t, "RelationshipDirectionMustBeValid", "InvalidRelationshipOriginReference", "InvalidRelationshipIntermediaryReference", "InvalidRelationshipDestinationReference");
    const refOk = r => isObj(r) && typeof r.id === "string" && typeof r.feature_type === "string" && get(r.id, r.feature_type);
    for (const r of byType.relationship) {
      const p = r.properties;
      if (!["directed", "undirected"].includes(p.direction)) add(t, "RelationshipDirectionMustBeValid", r.id, `direction ${str(p.direction)} moet "directed" of "undirected" zijn.`, "direction");
      if (p.origin != null && !refOk(p.origin)) add(t, "InvalidRelationshipOriginReference", r.id, `origin ${str(p.origin)} verwijst niet naar een bestaand feature van dat type.`, "origin");
      if (p.destination != null && !refOk(p.destination)) add(t, "InvalidRelationshipDestinationReference", r.id, `destination ${str(p.destination)} verwijst niet naar een bestaand feature van dat type.`, "destination");
      if (p.intermediary != null && (!Array.isArray(p.intermediary) || !p.intermediary.every(refOk))) add(t, "InvalidRelationshipIntermediaryReference", r.id, `intermediary bevat een ongeldige verwijzing.`, "intermediary");
    }
  }

  // Regels zonder (bijbehorende) features in het archief gelden als gecontroleerd zodra er niets te controleren valt
  const present = new Set(Object.keys(feats).map(F));
  for (const x of R.values()) if (!x.checked && x.feature !== "N/A" && x.feature !== "Manifest" && !present.has(x.feature)) { x.checked = true; x.partial = "Geen features van dit type in het archief."; }

  // Waarom een regel niet gecontroleerd wordt
  const WHY = { AddressMustHaveProvinceCode: "Vereist de ISO 3166-2-lijst met landen waarvoor een provinciecode verplicht is.",
    ReferencedAddressDoesNotMatchBuildingAddress: "Vereist bepalen in welke building een anchor ligt (vergelijking van vlakken).",
    BuildingNameMatchesOccupantName: "Vereist bepalen welke occupants in een building liggen (vergelijking van vlakken)." };
  for (const x of R.values()) if (!x.checked) x.partial = WHY[x.rule] || "Vereist een geometrische vergelijking van vlakken of lijnen (overlap, bedekking, snijding); niet ondersteund in deze viewer.";
  const rules = [...R.values()];
  const sev = s => issues.filter(i => i.severity === s).length;
  return { issues, rules, stats: { violations: sev("Violation"), warnings: sev("Warning"), info: sev("Info"),
    checked: rules.filter(r => r.checked).length, total: rules.length } };
}

// ======================================================================================
// Geometrische regels (vereist Turf.js en RBush). Draait na validateIMDF op dezelfde data.
// Tolerantie: oppervlakteverschillen tot GEO_TOL m² gelden als afrondingsruis (gedeelde randen
// met zwevendekommagetallen geven anders minuscule "overlap").
// ======================================================================================
const GEO_TOL = 0.01;   // m²
function validateIMDFGeometry({ data, result, progress = () => {} }) {
  const T = globalThis.turf, RB = globalThis.RBush;
  if (!T || !RB) throw new Error("Turf.js/RBush niet geladen");
  const R = new Map(result.rules.map(x => [x.feature + "|" + x.rule, x]));
  const issues = result.issues;
  const F = t => t[0].toUpperCase() + t.slice(1);
  const mark = (t, ...rs) => rs.forEach(r => { const x = R.get(F(t) + "|" + r); if (x) { x.checked = true; x.partial = x.partial && /Geen features/.test(x.partial) ? x.partial : null; } });
  const note = (t, r, n) => { const x = R.get(F(t) + "|" + r); if (x) x.partial = n; };
  const add = (t, r, fid, msg, attr = "geometry") => { const x = R.get(F(t) + "|" + r); if (!x) return; x.checked = true; x.count++;
    issues.push({ severity: x.severity, rule: r, feature: x.feature, ftype: t, fid, attr, msg }); };
  const byType = {}; for (const t of Object.keys(data)) byType[t] = (data[t]?.features || []).filter(f => f && f.properties);
  const all = t => byType[t] || [];
  const byId = new Map(); for (const t in byType) for (const f of byType[t]) if (typeof f.id === "string") byId.set(f.id, f);
  const poly = g => g && (g.type === "Polygon" || g.type === "MultiPolygon");
  const feat = g => ({ type: "Feature", properties: {}, geometry: g });
  const m2 = x => x < 1 ? x.toFixed(2).replace(".", ",") : Math.round(x).toLocaleString("nl-NL");
  const safe = (fn, d = null) => { try { return fn(); } catch { return d; } };
  const nPts = g => { let n = 0; const w = c => { if (typeof c[0] === "number") n++; else c.forEach(w); }; w(g.coordinates); return n; };
  const grow = (b, e = 1e-6) => [b[0] - e, b[1] - e, b[2] + e, b[3] + e];
  // Groot polygoon eerst uitsnijden tot de omgeving van het andere (scheelt enorm bij duizenden punten)
  const local = (big, around) => nPts(big) > 400 ? safe(() => T.bboxClip(feat(big), grow(bbox(around))).geometry, big) : big;
  const emptyG = g => !g || !g.coordinates || !g.coordinates.length || (g.type === "MultiPolygon" && g.coordinates.every(p => !p.length));
  // Oppervlakte van A ∩ B en A \ B
  const interArea = (a, b) => safe(() => { const A = local(a, b), B = local(b, a); if (emptyG(A) || emptyG(B)) return 0;
    const i = T.intersect(T.featureCollection([feat(A), feat(B)])); return i ? T.area(i) : 0; }, 0);
  const diffArea = (a, b) => safe(() => { const B = local(b, a); if (emptyG(B)) return T.area(feat(a));
    const d = T.difference(T.featureCollection([feat(a), feat(B)])); return d ? T.area(d) : 0; }, null);
  const unionOf = gs => { if (!gs.length) return null; if (gs.length === 1) return gs[0];
    return safe(() => T.union(T.featureCollection(gs.map(feat)))?.geometry || null); };
  const bbox = g => T.bbox(feat(g));
  const index = list => { const rb = new RB(); rb.load(list.filter(x => x.g).map(x => { const [a, b, c, d] = bbox(x.g); return { minX: a, minY: b, maxX: c, maxY: d, x }; })); return rb; };
  const near = (rb, g) => { const [a, b, c, d] = bbox(g); return rb.search({ minX: a, minY: b, maxX: c, maxY: d }).map(e => e.x); };
  const groupBy = (list, key) => { const m = new Map(); for (const x of list) { const k = key(x); if (k == null) continue; (m.get(k) || m.set(k, []).get(k)).push(x); } return m; };
  const levelOf = f => byId.get(f.properties.level_id);
  // Container met index op de randen: snel "ligt binnen" bepalen voor grote polygonen (levels, venue)
  const contCache = new Map();
  function container(f) {
    let c = contCache.get(f); if (c) return c;
    const segs = [], polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const pl of polys) for (const r of pl) for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1];
      segs.push({ minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2), x1, y1, x2, y2 }); }
    const rb = new RB(); rb.load(segs);
    c = { g: f.geometry, rb, bb: bbox(f.geometry) }; contCache.set(f, c); return c;
  }
  const pipC = (c, [x, y]) => { let n = 0;   // straal naar +x, alleen randen in die strook
    for (const s of c.rb.search({ minX: x, minY: y, maxX: c.bb[2] + 1, maxY: y })) if ((s.y1 > y) !== (s.y2 > y) && x < (s.x2 - s.x1) * (y - s.y1) / (s.y2 - s.y1) + s.x1) n++;
    return n % 2 === 1; };
  const firstPt = g => { let p = null; const w = c => { if (p) return; if (typeof c[0] === "number") p = c; else c.forEach(w); }; w(g.coordinates); return p; };
  // Punt binnen of op de rand van c
  const onEdge = (c, [x, y]) => c.rb.search({ minX: x - 1e-9, minY: y - 1e-9, maxX: x + 1e-9, maxY: y + 1e-9 }).some(s => {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = dx * dx + dy * dy; if (!L) return Math.hypot(x - s.x1, y - s.y1) < 1e-9;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / L)); return Math.hypot(x - (s.x1 + t * dx), y - (s.y1 + t * dy)) < 1e-9; });
  const ptCovered = (c, p) => onEdge(c, p) || pipC(c, p);
  // Lijnstuk AB "covered by" c: knip AB op de snijpunten met de randen van c en test van elk stukje het midden (exact)
  function segCovered(c, A, B) {
    if (!ptCovered(c, A) || !ptCovered(c, B)) return false;
    const ts = [0, 1], dx = B[0] - A[0], dy = B[1] - A[1];
    for (const s of c.rb.search({ minX: Math.min(A[0], B[0]), minY: Math.min(A[1], B[1]), maxX: Math.max(A[0], B[0]), maxY: Math.max(A[1], B[1]) })) {
      const ex = s.x2 - s.x1, ey = s.y2 - s.y1, den = dx * ey - dy * ex; if (!den) continue;
      const t = ((s.x1 - A[0]) * ey - (s.y1 - A[1]) * ex) / den, u = ((s.x1 - A[0]) * dy - (s.y1 - A[1]) * dx) / den;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
    }
    ts.sort((a, b) => a - b);
    for (let i = 1; i < ts.length; i++) { const m = (ts[i - 1] + ts[i]) / 2; if (ts[i] - ts[i - 1] > 1e-12 && !ptCovered(c, [A[0] + m * dx, A[1] + m * dy])) return false; }
    return true;
  }
  const lineCovered = (c, g) => { const lines = g.type === "LineString" ? [g.coordinates] : g.coordinates;
    return lines.every(l => l.every((p, i) => i === 0 || segCovered(c, l[i - 1], p))); };
  // Grootste afstand (m) tot de rand van c van de punten van g die buiten c liggen
  function maxDistOut(c, g) {
    let best = 0; const w = co => { if (typeof co[0] === "number") { if (ptCovered(c, co)) return;
      const [x, y] = co, k = Math.cos(y * Math.PI / 180), M = 111320; let d = Infinity;
      for (let r = 0.0005; d === Infinity && r < 1; r *= 4) for (const s of c.rb.search({ minX: x - r, minY: y - r, maxX: x + r, maxY: y + r })) {
        const ax = (s.x1 - x) * k * M, ay = (s.y1 - y) * M, bx = (s.x2 - x) * k * M, by = (s.y2 - y) * M, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0; d = Math.min(d, Math.hypot(ax + t * dx, ay + t * dy)); }
      if (d < Infinity) best = Math.max(best, d); } else co.forEach(w); };
    w(g.coordinates); return best;
  }
  const distTxt = d => d >= 1 ? d.toFixed(1).replace(".", ",") + " m" : Math.round(d * 100) + " cm";
  // Deel van g dat buiten container c valt: m² voor vlakken, 1/0 voor lijnen en punten
  function outside(g, c) {
    const b = bbox(g), whole = () => poly(g) ? T.area(feat(g)) : 1;
    if (b[2] < c.bb[0] || b[0] > c.bb[2] || b[3] < c.bb[1] || b[1] > c.bb[3]) return whole();
    const touches = c.rb.search({ minX: b[0] - 1e-7, minY: b[1] - 1e-7, maxX: b[2] + 1e-7, maxY: b[3] + 1e-7 }).length > 0;
    if (!touches) return pipC(c, firstPt(g)) ? 0 : whole();
    if (g.type === "Point") return ptCovered(c, g.coordinates) ? 0 : 1;
    if (/LineString/.test(g.type)) return lineCovered(c, g) ? 0 : 1;
    const clip = safe(() => T.bboxClip(feat(c.g), grow(b)).geometry, null);
    if (emptyG(clip)) return whole();
    if (poly(g)) return safe(() => { const d = T.difference(T.featureCollection([feat(g), feat(clip)])); return d ? T.area(d) : 0; }, 0);
    if (g.type === "Point") return ptCovered(c, g.coordinates) ? 0 : 1;
    return lineCovered(c, g) ? 0 : 1;
  }
  const STRUCT = new Set(["brick", "column", "concrete", "drywall", "glass", "structure", "wood"]);

  // ---- Paarsgewijze overlap binnen groepen ----
  function overlaps(t, rule, list, groupKey, label) {
    mark(t, rule);
    for (const [, grp] of groupBy(list.filter(f => poly(f.geometry)), groupKey)) {
      const items = grp.map(f => ({ f, g: f.geometry })), rb = index(items);
      for (const a of items) for (const b of near(rb, a.g)) {
        if (b.f.id <= a.f.id) continue;
        const ar = interArea(a.g, b.g);
        if (ar > GEO_TOL) add(t, rule, a.f.id, `Overlapt ${label} ${b.f.id} over ${m2(ar)} m².`);
      }
    }
  }
  // ---- "Covered by referenced level" ----
  function coveredByLevel(t, rule) {
    mark(t, rule);
    for (const f of all(t)) {
      const l = levelOf(f); if (!l || !poly(l.geometry) || !f.geometry) continue;
      const o = outside(f.geometry, container(l));
      if (poly(f.geometry) ? o > GEO_TOL : o) { const c = container(l), d = maxDistOut(c, f.geometry);
        add(t, rule, f.id, poly(f.geometry) ? `Valt voor ${m2(o)} m² buiten het verwezen level${d ? ` (tot ${distTxt(d)} van de rand)` : ""}.` : `Ligt ${d ? `tot ${distTxt(d)} ` : "(deels) "}buiten het verwezen level.`); }
    }
  }
  // ---- "Covered by a Unit" + structurele/opentobelow-units ----
  const unitIdx = new Map(); for (const [lid, us] of groupBy(all("unit").filter(u => poly(u.geometry)), u => u.properties.level_id)) unitIdx.set(lid, index(us.map(f => ({ f, g: f.geometry }))));
  function inUnits(t, coverRule, otbRule, structRule) {
    mark(t, coverRule, otbRule, structRule);
    for (const f of all(t)) {
      if (!poly(f.geometry)) continue;
      const rb = unitIdx.get(f.properties.level_id); if (!rb) continue;
      const cand = near(rb, f.geometry);
      const cover = cand.filter(u => !STRUCT.has(u.f.properties.category) && u.f.properties.category !== "opentobelow");
      // Eerst: ligt hij binnen één unit? (snel via randindex); zo niet, dan tegen de unie van de omliggende units
      const inOne = cover.some(u => outside(f.geometry, container(u.f)) <= GEO_TOL);
      if (!inOne) { const un = unionOf(cover.map(u => u.g)), d = un ? diffArea(f.geometry, un) : null;
        if (!un || (d != null && d > GEO_TOL)) add(t, coverRule, f.id, un ? `Valt voor ${m2(d)} m² buiten de units.` : `Ligt in geen enkele unit.`); }
      for (const u of cand) {
        const c = u.f.properties.category;
        if (c === "opentobelow" && outside(f.geometry, container(u.f)) <= GEO_TOL) add(t, otbRule, f.id, `Ligt binnen opentobelow-unit ${u.f.id}.`);
        if (STRUCT.has(c)) { const ar = interArea(f.geometry, u.g); if (ar > GEO_TOL) add(t, structRule, f.id, `Overlapt constructie-unit ${u.f.id} (${c}) over ${m2(ar)} m².`); }
      }
    }
  }

  // ---------- Zelfdoorsnijding (FileMustBeValidGeoJSON) ----------
  progress("Zelfdoorsnijding controleren…");
  { const r = R.get("N/A|FileMustBeValidGeoJSON");
    for (const t in byType) for (const f of byType[t]) {
      const g = f.geometry; if (!g || !/Polygon|LineString/.test(g.type)) continue;
      const k = safe(() => T.kinks(feat(g)).features, []);
      if (k.length) { r.checked = true; r.count++; issues.push({ severity: r.severity, rule: r.rule, feature: "N/A", ftype: t, fid: f.id, attr: "geometry",
        msg: `Geometrie snijdt zichzelf (${k.length} snijpunt${k.length > 1 ? "en" : ""}, o.a. ${k[0].geometry.coordinates.map(c => c.toFixed(7)).join(", ")}).` }); }
    }
    if (r) r.partial = null; }

  // ---------- Bedekking door verwezen level ----------
  progress("Ligging binnen levels controleren…");
  for (const [t, r] of [["unit", "UnitMustBeCoveredByReferencedLevel"], ["section", "SectionMustBeCoveredByReferencedLevel"], ["fixture", "FixtureMustBeCoveredByReferencedLevel"],
    ["kiosk", "KioskMustBeCoveredByReferencedLevel"], ["detail", "DetailMustBeCoveredByReferencedLevel"], ["opening", "OpeningMustBeCoveredByReferencedLevel"]]) coveredByLevel(t, r);
  mark("geofence", "GeofenceNotCoveredByReferencedLevel");
  for (const g of all("geofence")) for (const lid of g.properties.level_ids || []) { const l = byId.get(lid); if (!l || !poly(l.geometry) || !poly(g.geometry)) continue;
    const d = outside(g.geometry, container(l)); if (d > GEO_TOL) add("geofence", "GeofenceNotCoveredByReferencedLevel", g.id, `Valt voor ${m2(d)} m² buiten level ${lid}.`); }

  // ---------- Overlap ----------
  progress("Units op overlap controleren…");
  overlaps("unit", "UnitsMustNotOverlap", all("unit").filter(u => u.properties.category !== "opentobelow"), u => u.properties.level_id, "unit");
  progress("Sections, fixtures en kiosks op overlap controleren…");
  overlaps("section", "SectionsOverlap", all("section"), s => s.properties.level_id, "section");
  overlaps("fixture", "FixturesMustNotOverlap", all("fixture"), f => f.properties.level_id, "fixture");
  overlaps("kiosk", "KiosksMustNotOverlap", all("kiosk"), f => f.properties.level_id, "kiosk");
  overlaps("level", "LevelsShouldNotOverlap", all("level"), l => l.properties.ordinal, "level (zelfde ordinal)");
  mark("geofence", "GeofencesOverlap");
  { const lv = []; for (const g of all("geofence")) for (const l of g.properties.level_ids || []) lv.push({ f: g, l });
    for (const [, grp] of groupBy(lv, x => x.l)) { const items = grp.filter(x => poly(x.f.geometry)).map(x => ({ f: x.f, g: x.f.geometry })), rb = index(items);
      for (const a of items) for (const b of near(rb, a.g)) if (b.f.id > a.f.id) { const ar = interArea(a.g, b.g); if (ar > GEO_TOL) add("geofence", "GeofencesOverlap", a.f.id, `Overlapt geofence ${b.f.id} over ${m2(ar)} m².`); } } }
  mark("fixture", "FixtureMustNotOverlapKiosk");
  for (const [lid, ks] of groupBy(all("kiosk").filter(k => poly(k.geometry)), k => k.properties.level_id)) {
    const rb = index(ks.map(f => ({ f, g: f.geometry })));
    for (const fx of all("fixture").filter(f => f.properties.level_id === lid && poly(f.geometry))) for (const k of near(rb, fx.geometry)) {
      const ar = interArea(fx.geometry, k.g); if (ar > GEO_TOL) add("fixture", "FixtureMustNotOverlapKiosk", fx.id, `Overlapt kiosk ${k.f.id} over ${m2(ar)} m².`); } }

  // ---------- Fixtures en kiosks in units ----------
  progress("Fixtures en kiosks in units controleren…");
  inUnits("fixture", "FixtureMustBeCoveredByUnit", "OpenToBelowUnitMustNotContainFixture", "StructuralUnitMustNotContainFixture");
  inUnits("kiosk", "KioskMustBeCoveredByUnit", "OpenToBelowUnitMustNotContainKiosk", "StructuralUnitMustNotContainKiosk");

  // ---------- Levels volledig bedekt door units ----------
  progress("Bedekking van levels door units controleren…");
  mark("level", "LevelMustBeFullyCoveredByUnits");
  { const byLevel = groupBy(all("unit").filter(u => poly(u.geometry)), u => u.properties.level_id);
    let i = 0; const lv = all("level").filter(l => poly(l.geometry));
    for (const l of lv) {
      progress(`Bedekking van levels door units controleren… (${++i}/${lv.length})`);
      const un = unionOf((byLevel.get(l.id) || []).map(u => u.geometry));
      if (!un) continue;
      const gap = diffArea(l.geometry, un), out = diffArea(un, l.geometry);
      if ((gap != null && gap > GEO_TOL) || (out != null && out > GEO_TOL))
        add("level", "LevelMustBeFullyCoveredByUnits", l.id, "Unie van de units wijkt af van het level: " + [gap > GEO_TOL && `${m2(gap)} m² van het level is niet bedekt door units`, out > GEO_TOL && `${m2(out)} m² aan units valt buiten het level`].filter(Boolean).join(", ") + ".");
    } }

  // ---------- Footprints ----------
  progress("Footprints controleren…");
  const fps = c => all("footprint").filter(f => f.properties.category === c && poly(f.geometry));
  mark("footprint", "AerialFootprintMustNotContainOrEqualAerialFootprint", "GroundFootprintMustNotContainOrEqualGroundFootprint", "AerialFootprintsShouldNotOverlap",
    "GroundFootprintsShouldNotOverlap", "SubterraneanFootprintsOverlap", "AerialFootprintShouldCoverGroundFootprint", "GroundFootprintShouldIntersectSubterraneanFootprint",
    "IndoorLevelNotEqualToAerialFootprint", "IndoorLevelNotEqualToGroundFootprint", "IndoorLevelNotEqualToSubterraneanFootprint");
  for (const [c, containRule, overlapRule] of [["aerial", "AerialFootprintMustNotContainOrEqualAerialFootprint", "AerialFootprintsShouldNotOverlap"],
    ["ground", "GroundFootprintMustNotContainOrEqualGroundFootprint", "GroundFootprintsShouldNotOverlap"], ["subterranean", null, "SubterraneanFootprintsOverlap"]]) {
    const list = fps(c);
    for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      if (i === j) continue; const a = list[i], b = list[j];
      if (containRule && diffArea(b.geometry, a.geometry) <= GEO_TOL) add("footprint", containRule, a.id, `Bevat of is gelijk aan ${c}-footprint ${b.id}.`);
      else if (j > i) { const ar = interArea(a.geometry, b.geometry); if (ar > GEO_TOL) add("footprint", overlapRule, a.id, `Overlapt ${c}-footprint ${b.id} over ${m2(ar)} m².`); }
    }
  }
  const shareB = (a, b) => (a.properties.building_ids || []).some(x => (b.properties.building_ids || []).includes(x));
  for (const g of fps("ground")) { const aer = fps("aerial").filter(a => shareB(a, g));
    if (aer.length && !aer.some(a => diffArea(g.geometry, a.geometry) <= GEO_TOL)) add("footprint", "AerialFootprintShouldCoverGroundFootprint", g.id, `Geen aerial-footprint van dezelfde building bedekt deze ground-footprint.`); }
  for (const s of fps("subterranean")) if (!fps("ground").some(g => safe(() => T.booleanIntersects(feat(s.geometry), feat(g.geometry)), false)))
    add("footprint", "GroundFootprintShouldIntersectSubterraneanFootprint", s.id, `Snijdt of raakt geen enkele ground-footprint.`);
  // Unie van indoor-levels per building vergelijken met de footprint
  for (const [c, rule, test] of [["aerial", "IndoorLevelNotEqualToAerialFootprint", o => o >= 0], ["ground", "IndoorLevelNotEqualToGroundFootprint", o => o === 0],
    ["subterranean", "IndoorLevelNotEqualToSubterraneanFootprint", o => o <= -1]]) for (const fp of fps(c)) {
    const lv = all("level").filter(l => l.properties.outdoor === false && test(l.properties.ordinal) && poly(l.geometry) && shareB(l, fp));
    if (!lv.length) continue;
    const un = unionOf(lv.map(l => l.geometry)); if (!un) continue;
    const a = diffArea(un, fp.geometry), b = diffArea(fp.geometry, un);
    if ((a != null && a > GEO_TOL) || (b != null && b > GEO_TOL)) add("footprint", rule, fp.id, `Unie van ${lv.length} indoor-level(s) is niet gelijk aan de footprint: ` +
      [a > GEO_TOL && `${m2(a)} m² levels buiten de footprint`, b > GEO_TOL && `${m2(b)} m² footprint zonder level`].filter(Boolean).join(", ") + ".");
  }
  // Levels en footprints: zelfde building
  mark("level", "LevelAndAerialFootprintShouldReferenceSameBuilding", "LevelAndGroundFootprintShouldReferenceSameBuilding", "LevelAndSubterraneanFootprintShouldReferenceSameBuilding", "OutdoorLevelShouldNotOverlapGroundFootprint");
  for (const l of all("level").filter(l => poly(l.geometry))) {
    for (const [c, rule] of [["aerial", "LevelAndAerialFootprintShouldReferenceSameBuilding"], ["ground", "LevelAndGroundFootprintShouldReferenceSameBuilding"], ["subterranean", "LevelAndSubterraneanFootprintShouldReferenceSameBuilding"]])
      for (const fp of fps(c)) if (!shareB(l, fp) && !l.properties.outdoor && interArea(l.geometry, fp.geometry) > GEO_TOL) add("level", rule, l.id, `Overlapt ${c}-footprint ${fp.id}, maar verwijst niet naar dezelfde building.`);
    if (l.properties.outdoor === true && l.properties.ordinal === 0) for (const fp of fps("ground")) { const ar = interArea(l.geometry, fp.geometry);
      if (ar > GEO_TOL) add("level", "OutdoorLevelShouldNotOverlapGroundFootprint", l.id, `Buiten-level overlapt ground-footprint ${fp.id} over ${m2(ar)} m².`); }
  }

  // ---------- Geofence binnen footprints van building ----------
  mark("geofence", "GeofenceNotWithinReferencedBuildingFootprint");
  for (const g of all("geofence").filter(g => poly(g.geometry))) for (const bid of g.properties.building_ids || []) {
    const un = unionOf(all("footprint").filter(f => (f.properties.building_ids || []).includes(bid) && poly(f.geometry)).map(f => f.geometry));
    if (un && diffArea(g.geometry, un) > GEO_TOL) add("geofence", "GeofenceNotWithinReferencedBuildingFootprint", g.id, `Ligt (deels) buiten de footprints van building ${bid}.`); }

  // ---------- Openings en details ----------
  mark("opening", "OpeningMustBeCoveredByUnitBoundary", "OpeningsMustNotCrossOrOverlap");
  mark("detail", "DetailMustNotIntersectOpening");
  for (const [lid, os] of groupBy(all("opening").filter(o => o.geometry?.type === "LineString"), o => o.properties.level_id)) {
    const rb = index(os.map(f => ({ f, g: f.geometry }))), ub = unitIdx.get(lid);
    for (const o of os) {
      const onBoundary = ub && near(ub, o.geometry).some(u => safe(() => T.booleanWithin(feat(o.geometry), T.polygonToLine(feat(u.g))), false)
        || safe(() => (T.polygonToLine(feat(u.g)).features || [T.polygonToLine(feat(u.g))]).some(ln => T.booleanWithin(feat(o.geometry), ln)), false));
      if (!onBoundary) add("opening", "OpeningMustBeCoveredByUnitBoundary", o.id, `Ligt niet op de rand van een unit.`);
      for (const b of near(rb, o.geometry)) if (b.f.id > o.id && (safe(() => T.booleanCrosses(feat(o.geometry), feat(b.g)), false) || safe(() => T.booleanOverlap(feat(o.geometry), feat(b.g)), false)))
        add("opening", "OpeningsMustNotCrossOrOverlap", o.id, `Kruist of overlapt opening ${b.f.id}.`);
    }
    for (const d of all("detail").filter(d => d.properties.level_id === lid && d.geometry)) for (const o of near(rb, d.geometry))
      if (safe(() => T.booleanIntersects(feat(d.geometry), feat(o.g)), false)) add("detail", "DetailMustNotIntersectOpening", d.id, `Snijdt opening ${o.f.id}.`);
  }

  // ---------- Venue bevat alle features ----------
  progress("Ligging binnen de venue controleren…");
  mark("venue", "VenueMustCoverAllChildFeatures");
  { const v = all("venue")[0];
    if (v && poly(v.geometry)) { const c = container(v);
      for (const t of ["level", "footprint", "unit", "section", "fixture", "kiosk", "geofence", "opening", "detail", "amenity", "anchor"]) for (const f of all(t)) {
        if (!f.geometry) continue;
        const o = outside(f.geometry, c);
        if (poly(f.geometry) ? o > GEO_TOL : o) { const d = maxDistOut(c, f.geometry);
          add("venue", "VenueMustCoverAllChildFeatures", f.id, poly(f.geometry) ? `${t} valt voor ${m2(o)} m² buiten de venue${d ? ` (tot ${distTxt(d)})` : ""}.` : `${t} ligt ${d ? `tot ${distTxt(d)} ` : "(deels) "}buiten de venue.`); }
      } } }

  // ---------- Building-inhoud via ground-footprints ----------
  mark("building", "BuildingNameMatchesOccupantName"); mark("anchor", "ReferencedAddressDoesNotMatchBuildingAddress");
  { const fpOf = b => unionOf(all("footprint").filter(f => (f.properties.building_ids || []).includes(b.id) && poly(f.geometry)).map(f => f.geometry));
    const anchors = all("anchor").filter(a => a.geometry?.type === "Point");
    for (const b of all("building")) {
      const un = fpOf(b); if (!un) continue;
      const inside = anchors.filter(a => safe(() => T.booleanPointInPolygon(a.geometry.coordinates, feat(un)), false));
      const insideIds = new Set(inside.map(a => a.id));
      const names = b.properties.name && typeof b.properties.name === "object" ? Object.values(b.properties.name).map(s => String(s).trim().toLowerCase()) : [];
      if (names.length) for (const o of all("occupant")) if (insideIds.has(o.properties.anchor_id) && o.properties.name && Object.values(o.properties.name).some(n => names.includes(String(n).trim().toLowerCase())))
        add("building", "BuildingNameMatchesOccupantName", b.id, `Naam is gelijk aan die van occupant ${o.id} in deze building.`, "name");
      const bAddr = byId.get(b.properties.address_id)?.properties;
      if (bAddr) for (const a of inside) { const aa = byId.get(a.properties.address_id)?.properties; if (!aa) continue;
        const key = x => JSON.stringify([x.address, x.locality, x.province, x.country, x.postal_code]);
        if (key(aa) !== key(bAddr)) add("anchor", "ReferencedAddressDoesNotMatchBuildingAddress", a.id, `Adres van de anchor (zonder unit) wijkt af van het adres van building ${b.id}.`, "address_id"); }
    } }

  // Toelichtingen
  for (const x of result.rules) if (x.checked && !x.partial && /Overlap|Cover|Within|Equal|Contain|Intersect|Overlaps/.test(x.rule) && !/DisplayPoint/.test(x.rule))
    x.partial = `Geometrisch gecontroleerd met Turf.js; verschillen tot ${String(GEO_TOL).replace(".", ",")} m² gelden als afrondingsruis.`;
  const ob = R.get("Opening|OpeningDisplayPointShouldBeWithinBufferedDistanceOfOpening");
  if (ob && !ob.checked) ob.partial = "De standaard noemt geen bufferafstand; niet gecontroleerd.";
  const sev = s => issues.filter(i => i.severity === s).length;
  result.stats = { violations: sev("Violation"), warnings: sev("Warning"), info: sev("Info"), checked: result.rules.filter(r => r.checked).length, total: result.rules.length };
  return result;
}

// ---------- Web Worker: validatie op de achtergrond ----------
if (typeof window === "undefined" && typeof importScripts === "function") {
  self.onmessage = e => {
    const { data, lang, libs } = e.data;
    const post = m => self.postMessage(m);
    try {
      post({ progress: "Regels controleren…" });
      const result = validateIMDF({ data, lang });
      let geoError = null;
      try { importScripts(...libs); } catch (err) { geoError = "Turf.js/RBush konden niet geladen worden: " + err.message; }
      if (!geoError) { try { validateIMDFGeometry({ data, result, progress: p => post({ progress: p }) }); } catch (err) { geoError = err.message; } }
      result.geoError = geoError;
      post({ result });
    } catch (err) { post({ error: err.message }); }
  };
}
