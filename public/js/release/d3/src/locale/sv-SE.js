// wrapped by build app
define("d3/src/locale/sv-SE", ["dojo","dijit","dojox"], function(dojo,dijit,dojox){
import "locale";

var d3_locale_svSE = d3.locale({
  decimal: ",",
  thousands: "\xa0",
  grouping: [3],
  currency: ["", "SEK"],
  dateTime: "%A den %d %B %Y %X",
  date: "%Y-%m-%d",
  time: "%H:%M:%S",
  periods: ["fm", "em"],
  days: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
  shortDays: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"],
  months: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
});

});