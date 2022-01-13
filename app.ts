import express, { Request, Response, NextFunction } from 'express';
import { createConnection, getRepository } from 'typeorm';
import { User } from './src/entity/User';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

bodyParser.urlencoded({ extended: false })

const port = 3000;

interface LocationWithTimezone {
    location: string;
    timezoneName: string;
    timezoneAbbr: string;
    utcOffset: number;
};

const getLocationsWithTimezones = (request: Request, response: Response, next: NextFunction) => {
    let locations: LocationWithTimezone[] = [
        {
            location: 'Germany',
            timezoneName: 'Central European Time',
            timezoneAbbr: 'CET',
            utcOffset: 1
        },
        {
            location: 'China',
            timezoneName: 'China Standard Time',
            timezoneAbbr: 'CST',
            utcOffset: 8
        },
        {
            location: 'Argentina',
            timezoneName: 'Argentina Time',
            timezoneAbbr: 'ART',
            utcOffset: -3
        },
        {
            location: 'Japan',
            timezoneName: 'Japan Standard Time',
            timezoneAbbr: 'JST',
            utcOffset: 9
        }
    ];

    response.status(200).json(locations);
};

app.get('/timezones', getLocationsWithTimezones);

createConnection().then((connection) => {

    app.post('/users', async (request: Request, response: Response) => { // Save users
        const data = request.body;
        const user = new User();
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.age = data.age;
        user.phoneNumber = data.phoneNumber;
        await connection.manager.save(user);

        const users = await connection.manager.find(User);
        response.status(200).send(users)
    })

    app.get('/users', (request: Request, response: Response) => { // Get users with id and Phone number parameter
        const id = request.query.id;
        const phoneNumber = request.query.phoneNumber;

        if (!id) {
            response.status(400).json({ message: 'Id parameter is required', status: 400 })
        }

        if (!phoneNumber) {
            response.status(400).json({ message: 'Phone number parameter is required', status: 400 })
        }

        const userRepo = getRepository(User);

        userRepo.findOne({ where: { id, phoneNumber: phoneNumber } }).then(res => {
            response.status(200).send(res)
        }).catch(err => {
            response.status(400).send(err);
        })
    })

    app.delete('/users', (request: Request, response: Response) => { // Delete user
        const id = request.query.id as any;
        if (!id) {
            response.status(400).json({ message: 'Id parameter is required', status: 400 })
        }
        const userRepo = getRepository(User);
        userRepo.delete(id).then(res => {
            response.status(200).send(res)
        }).catch(err => {
            response.status(400).send(err);
        })
    })

    app.patch('/users', (request: Request, response: Response) => { // Update user with id query parameter passed in url
        const id = request.query.id as any;
        const body = request.body;
        if (!id) {
            response.status(400).json({ message: 'Id parameter is required', status: 400 })
        }
        const userRepo = getRepository(User);
        const data = {} as any;
        if (body.firstName) {
            data.firstName = body.firstName;
        }
        if (body.lastName) {
            data.lastName = body.lastName;
        }
        if (body.age) {
            data.age = body.age;
        }
        if (body.phoneNumber) {
            data.phoneNumber = body.phoneNumber;
        }
        userRepo.update({ id }, data).then((res) => {
            response.status(200).send(res)
        }).catch(err => response.status(400).send(err))

    })
}).catch(err => console.log(err));

app.listen(port, () => {
    console.log(`Timezones by location application is running on port ${port}.`);
});