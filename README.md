# eventfulAPI

Node js and Express, Mongodb and Mongdb Atlas

deployed on Heroku

CORS, and no authentication key required


## 1. Base url deployed on Heroku
```
https://eventfulapi.herokuapp.com/
```

When rightly connected with the above end_point, the server will return the following response:

```
You have connected to eventful API. Welcome!
```

## 2. GET
To get all events created in the database, use below end_point:
```
https://eventfulapi.herokuapp.com/events
```
### Additional query parameters:

| parameter  | value | usage  | 
| ------------- | ------------- | ------------- |
| category  | string  | search event by category  |
| hashtags  | string |search event by hashtags  |
| startDateTime  | ISO date string e.g. "2022-03-23" |seach events after this date  |
| search  | string |general search for matched events by the event title, organizer, and event description   |

## 3. POST

## 4. PUT

## 5. DELETE

# Tech stack
| tech stack  | usage |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

# deployment steps
The deployment is done through (Heroku)[https://devcenter.heroku.com/articles/git#deploy-your-code].
