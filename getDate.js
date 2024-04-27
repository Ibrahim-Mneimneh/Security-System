function getLebanonDateTime() {
  var now = new Date();
  var lebanonTime = new Date(now.getTime()); // Lebanon is UTC+3

  // Extract day, month, and year
  var day = lebanonTime.getDate();
  var month = lebanonTime.getMonth() + 1; // Months are zero-based
  var year = lebanonTime.getFullYear();

  // Format day, month, and year
  day = (day < 10 ? "0" : "") + day;
  month = (month < 10 ? "0" : "") + month;

  // Extract hour and minutes
  var hour = lebanonTime.getHours();
  var minutes = lebanonTime.getMinutes();

  // Format hour and minutes
  hour = (hour < 10 ? "0" : "") + hour;
  minutes = (minutes < 10 ? "0" : "") + minutes;

  // Return formatted date and time
  return day + "/" + month + "/" + year + " " + hour + ":" + minutes;
}

module.exports = { getLebanonDateTime };
