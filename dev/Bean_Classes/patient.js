const {v4 : uuidv4} = require('uuid');

function patient() {
	this.id="";
	this.name="";
	this.contact_no="";
	this.address="";
	this.dob="";
	this.weight="";
	this.height="";
};

patient.prototype.createNewEntry = function(name,contact_no,address,dob,weight,height) {
	this.id = uuidv4().split("-").join("");
	

};