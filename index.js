// import {express} from "express";
//express 모듈 불러오기
import express from "express"
import { MongoClient } from "mongodb";
import cors from "cors";
import { ObjectId } from "mongodb";
//express 사용
const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://petmap-five.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });


//Express 4.16.0버전 부터 body-parser의 일부 기능이 익스프레스에 내장 body-parser 연결

// json 형태의 문자열을 객체로 바꿔주는 코드
app.use(express.json());

// url 형태의 문자열 ?a=30&search=fdsff 이런거 객체로 바꿔주는 코드
app.use(express.urlencoded({ extended: true }));

// cors 우회해주는 코드
app.use(cors());

app.get('/api/find', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
    const client = new MongoClient(uri);
    const database = client.db('petmap');
    const collection = database.collection('H-info');


    try {
        await client.connect();
        console.log('MongoDB에 연결되었습니다.');


        // location 필드에 대한 지리 인덱스 생성
        await collection.createIndex({ location: "2dsphere" });

        // 첫 번째 단계: 'location' 필드가 존재하고, 그 값이 올바른 형식인 문서만 선택
        const validDocs = await collection.find({
            "영업상태명": "영업/정상",
            "location": { $exists: true, $type: "object" }
        }).toArray();

        // 두 번째 단계: 첫 번째 단계에서 선택된 문서 중에서 geospatial 쿼리 수행
        const query = {
            _id: { $in: validDocs.map(doc => doc._id) },
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        // coordinates: [126.941131, 33.459216] // 아마도 상록수역
                        // coordinates:  //롯데타워 arr
                        coordinates: [lon, lat] //석호중학교
                    },
                    $maxDistance: 2000
                }
            }
        };

        // 데이터 조회
        const result = await collection.find(query).toArray();
        return res.json(result.map(v => ({ ...v, _id: v._id.toString() })));
    } catch (error) {
        console.error('데이터 조회 중 오류가 발생했습니다.', error);
        return json({ error: 'Internal Server Error' }, 500);
    }
});

app.get('/api/walkmemo', async (req, res) => {
    try {
        const { date, userID } = req.query;

        const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
        const client = new MongoClient(uri);
        const database = client.db('petmap');
        const collection = database.collection('walkData');

        // 해당 날짜에 대한 데이터 조회 (예시로 모든 데이터 반환)
        // const data = await collection.find({ "date": date.slice(0, -14) });
        const data = await collection.find({ date: { $regex: new RegExp(date) } }, {userID : userID}).toArray();

        // // 필요한 속성만 선택하여 응답
        const responseData = data.map((item) => ({
            imageURL: item.coords,
            userID: item.userID,
            time: item.time,
            date: item.date,
        }));

        res.json(responseData); // JSON 형식으로 응답

        // return json(data.map(v => ({ ...v, _id: v._id.toString() })));
    } catch (error) {
        console.error('데이터 조회 중 오류가 발생했습니다.', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/Pet', async (req, res) => {
    try {
        const { userID } = req.query;
        console.log(`이거다 ${req.query.userID}`)

        const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
        const client = new MongoClient(uri);

        await client.connect(); // DB에 연결


        const database = client.db('petmap');
        const collection = database.collection('petdata');

        // 해당 날짜에 대한 데이터 조회 (예시로 모든 데이터 반환)
        // const data = await collection.find({ "date": date.slice(0, -14) });
        const data = await collection.find({ userID: userID }).toArray();
        console.log(`data = ${data}`)

        // 필요한 속성만 선택하여 응답
        const responseData = data.map((item) => ({
            imageURL: item.imageURL,
            userID: item.userID,
            name: item.name,
            birthday: item.birthday,
            kind: item.kind,
            _id: item._id.toString()
        }));

        res.json(responseData); // JSON 형식으로 응답
        // console.log(responseData)

        // return json(data.map(v => ({ ...v, _id: v._id.toString() })));
    } catch (error) {
        console.error('데이터 조회 중 오류가 발생했습니다.', error);
        res.status(500).json({ error: 'Server Error' });
    }
});



// req, res 요청, 응답
// 그냥 http://localhost:3000 으로 요청했을 시 코드
app.get("/api/abc", async (req, res) => {
    //경로가 http://localhost:3000/api/abc일 때 보임. 그냥 /하면 http://localhost:3000 으로 요청했을 시 코드
    //Hello World 데이터 반환
    // res.send("Hello World");

    // MongoDB 연결 및 데이터 저장 코드

    res.end('hello')
});

// req에는 올릴 데이터가 담겨있다
// 적절한 반환값을 작성.

/**
 * @path {GET} http://localhost:3000/api/users/:user_id
 * @description Path Variables 요청 데이터 값이 있고 반환 값이 있는 GET Method 
 * 
 *  Path Variables 방식
 * 
 *  ex) 아래 GET 주소 에서 :user_id 는 서버에서 설정한 주소 키 값이다.
 *      값을 찾을 때는 req.params.user_id 로 값을 찾는다.
 * 
 *  *주의 사항*
 *  :user_id 이 부분은 변수이기 때문에 
 *  경로가 /users/1 이거나 /users/2 이거 일때 둘다 라우터를 거치게 된다.
 *  그렇기 때문에 다른 라우터 보다 아래 있어야 한다.
 */


app.get("/api/:user_id", (req, res) => {
    // http://localhost:3000/api/abc
    // 이 때 user_id가 abc임

    const user_id = req.params.user_id

    //filter라는 함수는 자바스크립트에서 배열 함수이다. 필터링을 할때 많이 사용된다 필터링한 데이터를 새로운 배열로 반환한다.
    // const user = users.filter(data => data.id == user_id);

    // res.end(JSON.stringify({ ok:true, user}))

    res.json({ ok: true, user: user_id })

})

// app.get("/api/userPet", async (req, res) => {
//     const { userID } = req.query;
//     try {
//         const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
//         const client = new MongoClient(uri);

//         await client.connect(); // DB에 연결

//         const database = client.db('petmap');
//         const collection = database.collection('petdata');

//         const data = await collection.find({ userID: userID }).toArray();

//         console.log(`data = ${data}`)


//         const responseData = data.map((item) => ({
//             userID: item.userID,
//             name: item.name,
//             birthday: item.birthday,
//             kind: item.kind
//         }));

//         res.json(responseData); // JSON 형식으로 응답
//         // console.log(responseData.user)

//     } catch (error) {
//         console.error('데이터 조회 중 오류가 발생했습니다.', error);
//         res.status(500).json({ error: 'Server Error' });
//     } finally {
//         await client.close();
//     }
// })


/**
 * @path {POST} http://localhost:3000/api/users/add
 * @description POST Method
 * 
 *  POST 데이터를 생성할 때 사용된다.
 *  req.body에 데이터를 담아서 보통 보낸다.
 */
app.post("/api/users/add", async (req, res) => {

    const { imageURL, userID, name, birthday, kind } = req.body;
    const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('연결 성공, 새로 데이터 넣음')

        const collection = client.db('petmap').collection('petdata');

        await collection.insertOne(
            {
                "imageURL": imageURL,
                "userID": userID,
                "name": name,
                "birthday": birthday,
                "kind": kind
            }
        )
    } finally {
        await client.close();
    }

    res.status(200).json({ message: "데이터 업로드 성공" });

})

// app.post('/api/data', async (req, res) => {
//     const { lon, lat } = req.body; // 요청 본문으로부터 위도와 경도 받기

//     // 위도와 경도 값을 이용해서 MongoDB로부터 데이터 가져오기...
//     const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
//     const client = new MongoClient(uri);
//     // process.env.MONGO_URI

//     try {
//         await client.connect();
//         const database = client.db('petmap');
//         const collection = database.collection('H-info');

//         // 첫 번째 단계: 'location' 필드가 존재하고, 그 값이 올바른 형식인 문서만 선택
//         const validDocs = await collection.find({
//             "영업상태명": "영업/정상",
//             "location": { $exists: true, $type: "object" }
//         }).toArray();

//         // 두 번째 단계: 첫 번째 단계에서 선택된 문서 중에서 geospatial 쿼리 수행
//         const query = {
//             _id: { $in: validDocs.map(doc => doc._id) },
//             location: {
//                 $nearSphere: {
//                     $geometry: {
//                         type: "Point",
//                         coordinates: [lon, lat] //석호중학교
//                     },
//                     $maxDistance: 2000
//                 }
//             }
//         };
//         const result = await collection.find(query).toArray();

//         res.json(result);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Server Error" });
//     } finally {
//         client.close();
//     }
// });

app.post("/api/walkData", async (req, res) => {
    const { coords, timerResult, date, userId } = req.body; // 요청 본문으로부터 데이터 받기
    const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('연결 성공, 새로 데이터 넣음')

        const collection = client.db('petmap').collection('walkData');

        await collection.insertOne(
            {
                "userID": userId,
                "coords": coords,
                "time": timerResult,
                "date": date
            }
        )
    } finally {
        await client.close();
    }

    res.status(200).json({ message: "데이터 업로드 성공" });


})

app.delete('/api/Petdelete', async (req, res) => {
    const { _id } = req.body;

    const uri = 'mongodb+srv://ksoeun6204:hG5CM4TzUpDrAbXU@cluster0.1jfdc5b.mongodb.net/petmap';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const collection = client.db('petmap').collection('petdata');
        await collection.deleteOne({ _id: new ObjectId(_id)});  // deleteOne 메소드 사용

        res.status(200).json({ message: "데이터 삭제 성공" });
    } catch (error) {
        console.error("Error deleting data:", error);
        res.status(500).json({ message: "서버 내부 오류" });
    } finally {
        await client.close();
    }
})


app.delete("/api/user/delete", (req, res) => {

    const user_id = req.query.user_id

    //filter라는 함수는 자바스크립트에서 배열 함수이다. 필터링을 할때 많이 사용된다 필터링한 데이터를 새로운 배열로 반환한다.
    const user = users.filter(data => data.id != user_id);

    res.json({ ok: true, users: user })
})

// http listen port 생성 서버 실행
app.listen(5025, '0.0.0.0', () => console.log("성공")) ;