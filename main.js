const puppeteer = require('puppeteer');
const fs=require('fs');
var data = fs.readFileSync("data2.csv", "utf8");
data = data.split("\n");
console.log(`Finished loading data. Number of entries: ${ data.length}`);
var coords = fs.readFileSync("coords.csv", "utf8");
const headers = {"accept-language": "en-gb"};
var index = 0; // the index of the last SUCCESSFUL data entry. 
var successful_index = 0;
if (fs.existsSync("index.txt")) {
  index = parseInt(fs.readFileSync("index.txt"));
  successful_index = index;
  console.log(`Loaded last successful index: ${index}`)
}

(async () => {
  const browser = await puppeteer.launch( { headless: true } );
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders( headers );
    await page.setUserAgent( "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36" );
    await page.goto('https://www.google.com/maps');
  
    for (index = index + 1; index<data.length; index++) {
      var address = data[index];
      await page.click("#searchboxinput");
      await page.evaluate( () => document.getElementById("searchboxinput").value = "")
      await page.type("#searchboxinput", address);
      await page.click("#searchbox-searchbutton");
      await page.waitFor(500);
      await page.waitFor( ()=> window.location.href.match(/(\/@)(.*)(,\d\d?\D\/)/g) != null );
      var url = page.url();
      var coord = url.match(/(\/@)(.*)(,\d\d?\D\/)/g)[0].replace("/@", "").replace(/(,\d\d?\D\/)/g,"")
      console.log(`Coordinate found for data ${index}: ${coord}`);
      successful_index = index;
      coords = `${coords}"${address}",${coord}\n`;
    }
  
    await browser.close();
    fs.writeFileSync("coords.csv", coords);
    console.log("Data saved to coords.csv");
  } catch(e) {
    fs.writeFileSync(`coords.csv`, coords);
    // for data recovery
    fs.writeFileSync("index.txt", successful_index);
    console.log(`Data saved to coords.csv\nLast successful index ${successful_index}`);
    await page.screenshot( {
      path: "error.png"
    } );
    await browser.close();
    throw e;
  }
})();
