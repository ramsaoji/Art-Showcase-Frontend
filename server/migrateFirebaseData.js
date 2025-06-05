"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var client_1 = require("@prisma/client");
var dotenv = require("dotenv");
var result = dotenv.config();
if (result.error) {
    console.error("Error loading .env file:", result.error);
}
console.log("Environment variables loaded.");
// Firebase configuration (replace with your actual config or load from env)
var firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};
console.log("Firebase Config:", firebaseConfig);
// Initialize Firebase
var firebaseApp = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(firebaseApp);
// Initialize Prisma Client
var prisma = new client_1.PrismaClient();
function migrateData() {
    return __awaiter(this, void 0, void 0, function () {
        var artworksCol, artworkSnapshot, artworks, _i, artworks_1, artwork, id, createdAt, rest, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, 7, 9]);
                    console.log("Starting Firebase to Prisma migration...");
                    artworksCol = (0, firestore_1.collection)(db, "artworks");
                    return [4 /*yield*/, (0, firestore_1.getDocs)(artworksCol)];
                case 1:
                    artworkSnapshot = _a.sent();
                    artworks = artworkSnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
                    console.log("Found ".concat(artworks.length, " artworks in Firebase."));
                    _i = 0, artworks_1 = artworks;
                    _a.label = 2;
                case 2:
                    if (!(_i < artworks_1.length)) return [3 /*break*/, 5];
                    artwork = artworks_1[_i];
                    id = artwork.id, createdAt = artwork.createdAt, rest = __rest(artwork, ["id", "createdAt"]);
                    return [4 /*yield*/, prisma.artwork.upsert({
                            where: { id: id },
                            update: __assign(__assign({}, rest), { createdAt: (createdAt === null || createdAt === void 0 ? void 0 : createdAt.toDate) ? createdAt.toDate() : new Date() }),
                            create: __assign(__assign({ id: id }, rest), { createdAt: (createdAt === null || createdAt === void 0 ? void 0 : createdAt.toDate) ? createdAt.toDate() : new Date() }),
                        })];
                case 3:
                    _a.sent();
                    console.log("Migrated artwork with ID: ".concat(artwork.id));
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("Migration complete!");
                    return [3 /*break*/, 9];
                case 6:
                    error_1 = _a.sent();
                    console.error("Migration failed:", error_1);
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, prisma.$disconnect()];
                case 8:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
migrateData();
