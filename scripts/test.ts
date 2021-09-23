// import { nanoid } from "nanoid";
// // let date = new Date()
// // let tz = date.getTimezoneOffset();
// // let tzstr = date.getTime();

// // console.log(date);
// // console.log("timezone offset in minutes:", tz);
// // console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
// // console.log(Intl.DateTimeFormat().format(date));

// // const date1 = new Date(Date.UTC(2020, 11, 20, 3, 23, 16, 738));

// // console.log (date1);

// // ---------------------------------------------------
// // startDateTime
// // ---------------------------------------------------

// // get date from client
// const date2 = new Date(Date.UTC(2020, 0, 1, 1, 1, 1, 1));

// // startDateTime
// console.log(date2.toISOString());

// // startDateTimeUnix
// const date2Unix = date2.getTime();
// console.log(date2Unix);

// // get timezone from client
// // startDateTimeTZ
// console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);

// // get timezone offset
// // startDateTimeTZOffset
// const offset = date2.getTimezoneOffset();
// console.log(offset);

// // to display
// console.log(
//   new Intl.DateTimeFormat("en-GB", {
//     dateStyle: "full",
//     timeStyle: "long",
//   }).format(date2)
// );

// // from unix to date
// console.log(date2Unix);
// console.log(offset);

// const withOffset = new Date(date2Unix + offset);
// console.log(withOffset);
// console.log(
//   new Intl.DateTimeFormat("en-GB", {
//     dateStyle: "full",
//     timeStyle: "long",
//   }).format(withOffset)
// );

// //--------------------------------------------
// // crypto
// //--------------------------------------------

// console.log("\n----");

// const token = nanoid(10);
// console.log(token);
// console.log("----\n");

//--------------------------------------------
// date client <-> backend
//--------------------------------------------

console.log("date client <-> backend");
// client

const date = "2021-09-23";
const time = "18:12";
const dateTime=date+"T"+time;
const offset= -330;

const d = new Date((new Date(dateTime)).getTime() + offset);
console.log(
  new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeStyle: "long",
      }).format(d)
);

// const dateFromClient="2021-09-23T18:12" // in IST
// const timeFromClient="18:12" // in IST 
// const convertToDate = new Date(dateFromClient) // in GMT
// console.log('to date obj', convertToDate); // in GMT
// const convertToUnix = convertToDate.getTime();
// console.log('to unix', convertToUnix);
