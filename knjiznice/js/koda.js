
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

$(document).ready(function() {
    $( "#gen" ).click(function(event) {
        event.preventDefault();
        var chosen = 0;
        generirajPodatke(1,function(ehrId1){
            //$("#seznamUporabnikov").append("<li>"+ehrId+"</li>");
            pridobiImePriimek(ehrId1, function(ime, priimek){
                $("#seznamUporabnikov").append("<li class=\"oseba\"><a id=\"prvi\" href = \"#\">"+ime+" "+ priimek +"</a></li>");
            });
            generirajPodatke(2,function(ehrId2){
                pridobiImePriimek(ehrId2, function(ime, priimek){
                    $("#seznamUporabnikov").append("<li class=\"oseba\"><a id=\"drugi\" href = \"#\">"+ime+" "+ priimek +"</a></li>");
                });
                generirajPodatke(3,function(ehrId3){
                    pridobiImePriimek(ehrId3, function(ime, priimek){
                        $("#seznamUporabnikov").append("<li class=\"oseba\"><a id=\"tretji\" href = \"#\">"+ime+" "+ priimek +"</a></li>");
                        $( "#prvi" ).click(function(event) {
                            event.preventDefault();
                            prikaziSpletno(ehrId1);
                            console.log("kliknu sin  1 aosebo");
                        });
                        $( "#drugi" ).click(function(event) {
                            event.preventDefault();
                            prikaziSpletno(ehrId2);
                            console.log("kliknu sin  2 aosebo");
                        });
                        $( "#tretji" ).click(function(event) {
                            event.preventDefault();
                            prikaziSpletno(ehrId3);
                            console.log("kliknu sin  3 aosebo");
                        });
                    });
                });
                        
            });
        });

    });
});
var prikaziSpletno = function(ehrId){
    $(".oseba").remove();
}
var pridobiImePriimek = function(ehrId, callback){
    $.ajax({
        url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
        type: 'GET',
        success: function (data) {
            var party = data.party;
            callback(party.firstNames, party.lastNames);
        }
    });
};
/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
var generirajPodatke = function(stPacienta, callback) {
    var ehrId = "";
    var sessionId = getSessionId(); 
    console.log(sessionId);
    if(stPacienta === 1){
        //Usvarimo pacienta
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                //pridobimo ehr ID
                ehrId = data.ehrId;
                console.log(ehrId);
                // build party data
                var partyData = {
                    firstNames: "Prva",
                    lastNames: "Oseba",
                    dateOfBirth: "2000-3-15T23:00Z",
                    partyAdditionalInfo: [
                        {
                            key: "ehrId",
                            value: ehrId
                        },
                        {
                            key: "Type",
                            value: "Sporty"
                        },
                        {
                            key: "Country",
                            value: "SLO"
                        }
                    ]
                };
                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),
                    success: function (party) {
                        if (party.action == 'CREATE') {
                            
                            //adding composition 
                            var datumInUra = "2010-4-25T13:00Z";
                            var telesnaVisina = 150;
                            var telesnaTeza = 50;
                            var telesnaTemperatura = 36.5;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 120;
                            var diastolicniKrvniTlak = 80;
                            var nasicenostKrviSKisikom = 90;
                            var merilec = "Zan Valter Kamen";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 2
                            var datumInUra = "2012-6-05T15:00Z";
                            var telesnaVisina = 160;
                            var telesnaTeza = 60;
                            var telesnaTemperatura = 36.9;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 123;
                            var diastolicniKrvniTlak = 82;
                            var nasicenostKrviSKisikom = 95;
                            var merilec = "Zan Valter Kamen";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 2
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 3
                            var datumInUra = "2014-4-25T12:00Z";
                            var telesnaVisina = 173;
                            var telesnaTeza = 70;
                            var telesnaTemperatura = 37.1;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 126;
                            var diastolicniKrvniTlak = 86;
                            var nasicenostKrviSKisikom = 100;
                            var merilec = "Zan Valter Kamen";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 3
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    callback(ehrId);
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            console.log("Uspesno kreiran EHR"+ehrId);
                        }
                        
                    },
                    error: function(err){
                       console.log("Prislo je do napake"+JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    }
    else if(stPacienta === 2){
        //Usvarimo pacienta
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                //pridobimo ehr ID
                ehrId = data.ehrId;
        
                // build party data
                var partyData = {
                    firstNames: "Druga",
                    lastNames: "Oseba",
                    dateOfBirth: "1966-2-6T21:00Z",
                    partyAdditionalInfo: [
                        {
                            key: "ehrId",
                            value: ehrId
                        },
                        {
                            key: "Type",
                            value: "Family"
                        },
                        {
                            key:"Country",
                            value:"EN"
                        }
                    ]
                };
                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),
                    success: function (party) {
                        if (party.action == 'CREATE') {
                            //adding composition 
                            var datumInUra = "2010-4-25T13:00Z";
                            var telesnaVisina = 167;
                            var telesnaTeza = 75;
                            var telesnaTemperatura = 37.5;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 139;
                            var diastolicniKrvniTlak = 89;
                            var nasicenostKrviSKisikom = 70;
                            var merilec = "Tadej Pecenko";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 2
                            var datumInUra = "2014-6-05T15:00Z";
                            var telesnaVisina = 166;
                            var telesnaTeza = 74;
                            var telesnaTemperatura = 36.0;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 142;
                            var diastolicniKrvniTlak = 92;
                            var nasicenostKrviSKisikom = 75;
                            var merilec = "Tadej Pecenko";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 2
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 3
                            var datumInUra = "2015-11-11T12:00Z";
                            var telesnaVisina = 176;
                            var telesnaTeza = 76;
                            var telesnaTemperatura = 36.9;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 140;
                            var diastolicniKrvniTlak = 90;
                            var nasicenostKrviSKisikom = 90;
                            var merilec = "Tadej Pecenko";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 3
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    callback(ehrId);
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });  
                            console.log("Uspesno kreiran EHR"+ehrId);
                        }
                    },
                    error: function(err){
                       console.log("Prislo je do napake"+JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    
    }
    else if(stPacienta === 3){
        //Usvarimo pacienta
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                //pridobimo ehr ID
                ehrId = data.ehrId;
        
                // build party data
                var partyData = {
                    firstNames: "Tretja",
                    lastNames: "Oseba",
                    dateOfBirth: "1942-6-12T17:00Z",
                    partyAdditionalInfo: [
                        {
                            key: "ehrId",
                            value: ehrId
                        },
                        {
                            key: "Type",
                            value: "Old"
                        },
                        {
                            key:"Country",
                            value:"ITA"
                        }
                    ]
                };
                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),
                    success: function (party) {
                        if (party.action == 'CREATE') {
                            //adding composition 
                            var datumInUra = "2009-4-25T13:00Z";
                            var telesnaVisina = 160;
                            var telesnaTeza = 63;
                            var telesnaTemperatura = 36.0;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 100;
                            var diastolicniKrvniTlak = 60;
                            var nasicenostKrviSKisikom = 90;
                            var merilec = "Vilman Life";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 2
                            var datumInUra = "2011-8-22T10:00Z";
                            var telesnaVisina = 160;
                            var telesnaTeza = 65;
                            var telesnaTemperatura = 36.6;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 98;
                            var diastolicniKrvniTlak = 59;
                            var nasicenostKrviSKisikom = 80;
                            var merilec = "Vilman Life";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 2
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });
                            //adding composition 3
                            var datumInUra = "2016-1-01T12:00Z";
                            var telesnaVisina = 159;
                            var telesnaTeza = 63;
                            var telesnaTemperatura = 36.9;
                            //http://www.ezdravje.com/srce-in-zilje/visok-krvni-tlak/?s=vse
                            var sistolicniKrvniTlak = 95;
                            var diastolicniKrvniTlak = 55;
                            var nasicenostKrviSKisikom = 85;
                            var merilec = "Vilman Life";
                    		$.ajaxSetup({
                    		    headers: {"Ehr-Session": sessionId}
                    		});
                    		//creating composition 3
                    		var compositionData = {
                    			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
                                 // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
                    		    "ctx/language": "en",
                    		    "ctx/territory": "SI",
                    		    "ctx/time": datumInUra,
                    		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                    		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                    		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                    		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                    		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                    		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                    		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
                    		};
                    		//creating query
                    		var queryParams = {
                                "ehrId": ehrId,
                                templateId: 'Vital Signs',
                                format: 'FLAT',
                                committer: merilec
                            };
                            $.ajax({
                                url: baseUrl + "/composition?" + $.param(queryParams),
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify(compositionData),
                                success: function (res) {
                                    callback(ehrId);
                                    console.log("Composition succesfull");
                                },
                                error: function(err) {
                                    console.log("Composition error");
                                }
                            });  
                            console.log("Uspesno kreiran EHR"+ehrId);
                        }
                    },
                    error: function(err){
                       console.log("Prislo je do napake"+JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    
    
    }
    // TODO: Potrebno implementirati

    //return ehrId;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
