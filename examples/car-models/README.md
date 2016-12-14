# Create App Example

An AngularJS example listing different car models with some statistics in a session app using the QIX service. Data is loaded from a CSV file and visualized using d3.


## Prerequisites

1. Go to the QMC of your Qlik Sense Enterprise.
2. Open the *Content libraries* view and select _Default_ .
3. Upload the file [redirect.html](redirect.html).

This will enable the default authentication module to properly log in the user and make a redirect to the web server of this example, reusing the same session.


## Running

Install dependencies and run the app with:

```bash
npm install
npm run start
```

Open your browser and navigate to [http://localhost:8080](http://localhost:8080).
