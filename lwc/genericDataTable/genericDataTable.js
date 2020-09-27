/*
    Developer: Kishan Pansuriya
*/

/* eslint-disable no-console */
import { LightningElement, api, track } from 'lwc';
import loadData from '@salesforce/apex/DataTableHelper.loadData';
import loadRelatedRecords from '@salesforce/apex/DataTableHelper.loadRelatedRecords';
import getAllChildRelations from '@salesforce/apex/DataTableHelper.getAllChildRelations';

export default class GenericDataTable extends LightningElement {

    @track dataLoading = true;
    @api sObjectName = 'Account';
    @api displayColumns = '[{"label":"Id","fieldName":"Id", "sortable":"true"},{"label":"Name","fieldName":"Name", "sortable":"true"},{"label":"Created Date","fieldName":"CreatedDate", "sortable":"true"}]';
    @track columnsFieldData = [];
    @api loadedData;
    @api loadedDataBackup;
    @api tableHeight = 300;
    @api tableWidth = 600;
    @api maximumNumberOfRecords = 10000;
    @api paginationEnabled = false;
    @api lazyLoadingEnabled = false;
    @api paginationRecordsPerStep = 5;
    @track searchCounter = 0;
    @track rowNumberOffset = 0;
    @api relatedListParentRecordId = '';
    @api hideCheckboxColumn = false;
    @api showRowNumberColumn = false;
    @api sortBy = 'Name';
    @api sortDirection = 'asc';
    @track error = '';
    @track paginationOffsetCounter = 0;
    @track paginationOffset = 0;
    @track disablePreviousButton = true;
    @track disableNextButton = false;
    @track selectedChildObject;
    @track childObjectSelectionValue;
    @track childObjectOptions = [];
    @track disableCombobox = false;
    @track disableLoadMoreButton = false;
    @api hideSearchBar = false;

    constructor() {
        super();
        this.paginationEnabled = false;
        this.showRowNumberColumn = true;
        this.lazyLoadingEnabled = true;
    }

    connectedCallback() {
        //this.loadAjaxData();
        this.displayColumns = JSON.parse(this.displayColumns);        
        for(let key in this.displayColumns){
            this.columnsFieldData.push(this.displayColumns[key].fieldName);
        }        
        if (!this.loadedData) {
            this.commonDataLoader();
        }
    }

    handleOnSort(event) {
        let fieldName = event.detail.fieldName;
        let sortDirection = event.detail.sortDirection;
        //assign the values
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;
        //call the custom sort method.
        this.sortData(fieldName, sortDirection);
    }

    sortData(fieldName, sortDirection) {
        let sortResult = Object.assign([], this.loadedData);
        this.loadedData = sortResult.sort(function (a, b) {
            if (a[fieldName] < b[fieldName])
                return sortDirection === 'asc' ? -1 : 1;
            else if (a[fieldName] > b[fieldName])
                return sortDirection === 'asc' ? 1 : -1;
            else
                return 0;
        })
    }

    handlePrevious() {
        this.dataLoading = true;
        this.loadedData = [];
        this.paginationOffsetCounter = this.paginationOffsetCounter - 1;
        this.paginationOffset = this.paginationRecordsPerStep * this.paginationOffsetCounter;
        this.rowNumberOffset = this.rowNumberOffset - this.paginationRecordsPerStep;
        this.commonDataLoader();
        this.disableNextButton = false;
    }

    handleNext() {
        this.dataLoading = true;
        delete this.loadedData;
        this.paginationOffsetCounter = this.paginationOffsetCounter + 1;
        this.paginationOffset = this.paginationRecordsPerStep * this.paginationOffsetCounter;
        this.rowNumberOffset = this.rowNumberOffset + this.paginationRecordsPerStep;
        this.commonDataLoader();
        this.disablePreviousButton = false;
    }

    handleLoadMore(){
        this.dataLoading = true;
        this.paginationOffsetCounter = this.paginationOffsetCounter + 1;
        this.paginationOffset = this.paginationRecordsPerStep * this.paginationOffsetCounter;
        //this.rowNumberOffset = this.rowNumberOffset + this.paginationRecordsPerStep;
        this.commonDataLoader();
    }

    commonDataLoader() {
        if (!this.relatedListParentRecordId) {
            //If relatedListParentRecordId parameter is provided than it will ignore all other attributes.
            this.loadSobjectRecords();
        }else{
            this.loadChildObjectsList();
        }
    }

    loadSobjectRecords(){
        loadData({
            sObjectName: this.sObjectName,
            recordsLimit: this.paginationRecordsPerStep,
            offset: this.paginationOffset,
            fieldsList: this.columnsFieldData,
        }).then(
            //result => console.log(result)
            result => {
                if(this.lazyLoadingEnabled && !this.paginationEnabled && this.paginationOffset > 0){
                    let tempArray = [];
                    tempArray = [...this.loadedData, ...result];
                    this.loadedData = [...tempArray];
                    tempArray = [];
                    tempArray = [...this.loadedDataBackup, ...result];                   
                    this.loadedDataBackup = [...tempArray]; 
                    if(result.length < this.paginationRecordsPerStep){
                        this.disableLoadMoreButton = true;                        
                    }                    
                }else{
                    this.loadedData = result;
                    this.loadedDataBackup = result;
                }               
                if (this.loadedData.length < this.paginationRecordsPerStep) {
                    this.disableNextButton = true;
                    this.disableLoadMoreButton = true;
                }
                if (this.paginationOffsetCounter == 0) {
                    this.disablePreviousButton = true;
                }
                this.dataLoading = false;
                if(this.loadedData.length == 0){
                    this.error = 'No records found for given sObject!';
                }else{
                    this.error = '';
                }
            }
        ).catch(           
            error => {
                this.dataLoading = false; 
                this.error = error.body.message; 
            }
        );
    }

    loadChildObjectsList(){        
        getAllChildRelations({
            sObjectId: this.relatedListParentRecordId
        }).then(
            //result => console.log(result)
            result => {                               
                result = JSON.parse(result);  
                let items = [];                
                for(let k in result)  {
                    items.push({value: k , label: k.split(' ')[0] + ' - ' + result[k], temp1: result[k]});                                   
                }          
                this.childObjectOptions = items;                                               
                this.dataLoading = false;
                if(items.length == 0){
                    this.error = 'Givern sObject is not parent to any other object!';
                }else{                    
                    this.error = '';
                }
            }
        ).catch(           
            error => {               
                this.dataLoading = false;
                this.error = error.body.message; 
            }
        );
    }

    loadRelatedRecords(){
        loadRelatedRecords({
            parentRecordId: this.relatedListParentRecordId,
            recordsLimit: this.paginationRecordsPerStep,
            offset: this.paginationOffset,
            childSobjectName: this.selectedChildObject,
            parentFieldReferenceName: this.childObjectSelectionValue,
            fieldsList: this.columnsFieldData,
        }).then(
            //result => console.log(result)
            result => {
                this.disableCombobox = false;
                if(this.lazyLoadingEnabled && !this.paginationEnabled && this.paginationOffset > 0){
                    let tempArray = [];
                    tempArray = [...this.loadedData, ...result];
                    this.loadedData = [...tempArray];
                    tempArray = [];
                    tempArray = [...this.loadedDataBackup, ...result];
                    this.loadedDataBackup = [...tempArray];
                    if(result.length < this.paginationRecordsPerStep){
                        this.disableLoadMoreButton = true;
                    }                    
                }else{
                    this.loadedData = result;
                    this.loadedDataBackup = result;
                }            
                if (this.loadedData.length < this.paginationRecordsPerStep) {
                    this.disableLoadMoreButton = true;
                    this.disableNextButton = true;
                }
                if (this.paginationOffsetCounter == 0) {
                    this.disablePreviousButton = true;
                }
                this.dataLoading = false;
                if(this.loadedData.length == 0){
                    this.error = 'No records found for related selection!';
                }else{
                    this.error = '';
                }
            }
        ).catch(           
            //error => console.log(error) 
            error => {
                console.log(error);
                this.loadedData = []; 
                this.disableCombobox = false;
                this.error = error.body.message;
                this.dataLoading = false;
            }
        );
    }

    handleChildObjectSelection(event){
        this.childObjectSelectionValue = event.detail.value;
        for(let i=0; i < this.childObjectOptions.length; i++){
            if(this.childObjectOptions[i].value === this.childObjectSelectionValue){
                this.selectedChildObject = this.childObjectOptions[i].value.split(' ')[0];
                this.childObjectSelectionValue = this.childObjectOptions[i].temp1;
            }
        }    
        this.disableCombobox = true;
        this.loadRelatedRecords();
    }    

    sortDataOld() {
        var data = JSON.parse(JSON.stringify(this.loadedData));
        //function to return the value stored in the field
        var key = (a) => a[this.sortBy];
        var reverse = this.sortDirection === 'asc' ? 1 : -1;
        data.sort((a, b) => {
            let valueA = key(a) ? key(a).toLowerCase() : '';
            let valueB = key(b) ? key(b).toLowerCase() : '';
            return reverse * ((valueA > valueB) - (valueB > valueA));
        });

        //set sorted data to opportunities attribute
        this.loadedData = data;
    }

    handleDataFilter(event){        
        //const isEnterKey = event.keyCode === 13;        
        this.searchCounter++;
        if(this.searchCounter > 1){
            this.loadedData = [...this.loadedDataBackup]; 
        }
        if(event.target.value.toLowerCase()){                   
            this.filterData(event.target.value.toLowerCase());
        }else{
            this.clearFilter();
        }        
    }

    filterData(searchTerm){
        let tempArray = [];  
        for(let key in this.loadedData){
            if(((JSON.stringify(this.loadedData[key])).toLowerCase()).indexOf((searchTerm).toLowerCase())  >= 0){
                tempArray.push(this.loadedData[key]);
            }
        }
        this.loadedData = [...tempArray];
    }

    clearFilter(){
        this.loadedData = [...this.loadedDataBackup];        
    }

    loadAjaxData() {
        fetch('https://jsonplaceholder.typicode.com/todos/1')
            .then(response => response.json())
            .then(json => console.log(json))
    }

}