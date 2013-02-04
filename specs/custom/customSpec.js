describe("convert date" ,function() {
   
   it("should convert the date", function() {
      var date = new Date(2013, 00, 25);
      var result = ISODateString(date);
      expect(result).toEqual("2013-01-25");   
   });
});

describe("format date", function() {
   
   it("should format the date", function() {
      var dateString = "2013-01-25";
      var results = displayDateString(dateString);
      expect(results);
   });
   
});
