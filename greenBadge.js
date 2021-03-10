// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calculator;

const engTitle = "Vaccination Certificate";
const hebTitle = "תעודת חיסון";
const smallFont = Font.lightSystemFont(10);
const regularFont = Font.semiboldSystemFont(12);
const bigFont = Font.boldSystemFont(17);
const titles = [{'string': engTitle, 'font': smallFont}, {'string': hebTitle, 'font': bigFont}];
const widgetFolderName = "Covid19";
const QRFileName = "qr.png";
const docFileName = "document.pdf";
const APIBaseUrl = "http://api.qrserver.com/v1/";
const readQr = "read-qr-code/";
const createQr = "create-qr-code/?data=";
const [bgColor, textColor] = getBgColorByDeviceTheme();


// init file manager and check for files
let fm = FileManager.local();
const iCloudUsed = fm.isFileStoredIniCloud(module.filename);
fm = iCloudUsed ? FileManager.iCloud() : fm;
const offlinePath = fm.joinPath(fm.documentsDirectory(), widgetFolderName);
const filesError = `make sure that ${QRFileName} and ${docFileName} located under ${offlinePath}`;

// validate directory and files
validateDirectoryState(offlinePath, QRFileName, docFileName);

// get the qr image and doc
const QRPath = fm.joinPath(offlinePath, QRFileName);
const docPath = fm.joinPath(offlinePath, docFileName);

// get the data from the qr
const data = await getGreenBadgeData(APIBaseUrl, readQr, QRPath);

eval("badgeDict = " + data)

// wtf with those keys?!
const enFirstName = badgeDict['g'];
const enLastName = badgeDict['f'];
const hebFirstName = badgeDict['gl'];
const hebLastName = badgeDict['fl'];
const id = badgeDict['idl'];
const secondVacc = getFixedDate(badgeDict['d2']['d']);
const bday = getFixedDate(badgeDict['b']);
const info = {
                "שם לועזי": [enFirstName, enLastName].join(" "),
                "שם מלא": [hebFirstName, hebLastName].join(" "),
                "ת.ז": id,
                "תאריך לידה": bday,
                "חיסון שני": secondVacc
             };

const widget = createWidget(info);
Script.setWidget(widget);
QuickLook.present(docPath);
Script.complete();

function validateDirectoryState(offlinePath, QRFileName, docFileName) {
    if (!fm.fileExists(offlinePath)) {
        fm.createDirectory(offlinePath);
        throw `Directory ${offlinePath} create, ${filesError}`;
    }
    let QRPath = fm.joinPath(offlinePath, QRFileName);
    let docPath = fm.joinPath(offlinePath, docFileName);
    if (!fm.fileExists(QRPath) || !fm.fileExists(docPath)) {
        throw filesError;
    }
}

function createWidget(info) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color(bgColor);
    const globalStack = widget.addStack();
    globalStack.addSpacer();
    const QRStack = globalStack.addStack();
    QRStack.addSpacer();
    let QR = QRStack.addImage(Image.fromFile(QRPath));	
    QR.imageSize = new Size(150, 150);
    globalStack.addSpacer();
    const infoStack = globalStack.addStack();
    infoStack.layoutVertically();
    addTitles(infoStack);
    for (let key in info) {
        addDetail(infoStack, key, info[key]);
    }
    return widget;
}

function addTitles(infoStack) {
    for (let title of titles) {
        let titleStack = infoStack.addStack();
        titleStack.centerAlignContent();
        titleStack.addSpacer();
        addFormattedText(titleStack, title['string'], title['font']);
        titleStack.addSpacer();
    }
}

function addDetail(infoStack, key, value) {
    const detailStack = infoStack.addStack();
    detailStack.centerAlignContent();
    detailStack.addSpacer();
    addFormattedText(detailStack, value + " ", regularFont, Color.black(), 0);
    addFormattedText(detailStack, key, smallFont, Color.gray(), 0);
    infoStack.addSpacer(8)
}

function addFormattedText(stack, string, font) {
    const text = stack.addText(string);
    text.font = font;
    text.textColor = textColor;
}

function getBgColorByDeviceTheme() {
    return Device.isUsingDarkAppearance() ? ["#000000",Color.white()]: ["#F0FFF2", Color.black()];
}

function getFixedDate(date) {
    return date.split('-').reverse().join('/');
}

async function getGreenBadgeData(APIBaseUrl, readQr, QRPath) {
    let req = new Request(APIBaseUrl + readQr);
    req.method = "POST";
    image = Image.fromFile(QRPath);
    req.addImageToMultipart(image, "file");
    let badgeInfo = await req.loadJSON();
    badgeInfo = badgeInfo[0]['symbol'][0]['data'];
    return badgeInfo.match("{(.+)")[0];
}