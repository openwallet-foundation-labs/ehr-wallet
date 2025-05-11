self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/index.js"
    ],
    "/ScheduleExam": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/ScheduleExam.js"
    ],
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/patients": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/patients.js"
    ],
    "/patients/register": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/patients/register.js"
    ],
    "/scheduling": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/scheduling.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];