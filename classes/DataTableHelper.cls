public class DataTableHelper {
    
    @AuraEnabled(cacheable=true)
    public static List<Sobject> loadData(String sObjectName, Integer recordsLimit, Integer offset, List<String> fieldsList){          
		String mQuery = 'SELECT ' + string.join(fieldsList,',') + ' FROM ' + sObjectName + ' LIMIT ' + recordsLimit + ' OFFSET ' + offset;        
        System.debug(mQuery);
        return Database.query(mQuery);
    }
    
    @AuraEnabled(cacheable=true)
    public static String getAllChildRelations(Id sObjectId){
        System.debug('sObjectId: ' + sObjectId);
        //Id sObjectId = Id.valueOf(sObjectValue);
        //Sobject obj = sObjectId.getSObjectType().getDescribe().getName();
        Map<String, Integer> duplicateTracker = new Map<String, Integer>();
        Map<String, String> objectFieldReference = new Map<String, String>();
        Schema.DescribeSObjectResult R = sObjectId.getSObjectType().getDescribe();
		for (Schema.ChildRelationship cr: R.getChildRelationships()) {            
            if(objectFieldReference.get(''+cr.getChildSObject()) == null){                
            	objectFieldReference.put(''+cr.getChildSObject(), ''+cr.getField());
                duplicateTracker.put(''+cr.getChildSObject(), 0);
            }else{                
                Integer currentVal = duplicateTracker.get(''+cr.getChildSObject());
                currentVal++;
                objectFieldReference.put(''+cr.getChildSObject() + ' ' + currentVal, ''+cr.getField());
                duplicateTracker.put(''+cr.getChildSObject(), currentVal);
            }
		}        
        return JSON.serialize(objectFieldReference);
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Sobject> loadRelatedRecords(String parentRecordId, String childSobjectName, String parentFieldReferenceName, Integer recordsLimit, Integer offset, List<String> fieldsList){                  
		String mQuery = 'SELECT ' + string.join(fieldsList,',') + ' FROM ' + childSobjectName + ' WHERE ' + parentFieldReferenceName + ' = \'' + parentRecordId + '\' LIMIT ' + recordsLimit + ' OFFSET ' + offset;        
        System.debug(mQuery);
        return Database.query(mQuery);
    }
    
}