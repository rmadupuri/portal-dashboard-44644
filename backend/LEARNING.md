# 🎓 Backend Development Learning Guide

## What You've Learned So Far

### 1. Project Structure
You now have a professional backend structure:
- Organized folders for different concerns
- Separation of configuration, logic, and routes
- Environment-based configuration

### 2. Key Concepts

#### Express.js
Express is a **web framework** for Node.js. Think of it as:
- A waiter in a restaurant (takes orders/requests, delivers food/responses)
- Handles incoming HTTP requests
- Sends back HTTP responses

#### Middleware
Middleware are functions that run **before** your main code:
```javascript
Request → Middleware 1 → Middleware 2 → Your Code → Response
```

Examples:
- **CORS**: "Is this request from an allowed website?"
- **Auth**: "Is this user logged in?"
- **Validation**: "Is the data correct?"
- **Logging**: "Record this request"

#### Environment Variables
Why use .env files?
- Keep secrets out of code (passwords, API keys)
- Different settings for dev/production
- Never commit .env to Git!

#### RESTful API
REST = **RE**presentational **S**tate **T**ransfer

Standard way to structure APIs:
```
GET    /api/submissions      → Get all submissions
POST   /api/submissions      → Create new submission
GET    /api/submissions/123  → Get submission #123
PUT    /api/submissions/123  → Update submission #123
DELETE /api/submissions/123  → Delete submission #123
```

### 3. HTTP Status Codes
- **200** - OK (success)
- **201** - Created (new resource created)
- **400** - Bad Request (invalid data)
- **401** - Unauthorized (not logged in)
- **403** - Forbidden (logged in but no permission)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error (our code broke)

## What's Next?

### Lesson 2: Database Models
We'll learn:
- How to define data structure
- Relationships between tables
- Database migrations

### Lesson 3: API Endpoints
We'll create:
- Submission endpoints
- Authentication endpoints
- File upload endpoints

### Lesson 4: Authentication
We'll implement:
- User registration
- Login/logout
- JWT tokens
- OAuth (Google, GitHub)

### Lesson 5: Testing
We'll write:
- Unit tests
- Integration tests
- API tests

## Practice Exercises

1. **Modify the server**:
   - Change the port to 3000
   - Add a new route: GET /api/version
   - Return: { version: "1.0.0" }

2. **Understand Middleware**:
   - Add console.log to track request flow
   - Create a custom middleware that logs timestamps

3. **Study the Code**:
   - Read server.js line by line
   - Look up any unfamiliar concepts
   - Try to explain each middleware

## Common Questions

### Q: Why Node.js instead of Python/Java/etc?
A: 
- Same language as frontend (JavaScript)
- Great for I/O-heavy applications (APIs)
- Large ecosystem (npm)
- Fast and scalable

### Q: Why PostgreSQL instead of MongoDB?
A:
- Structured data (submissions have fixed fields)
- Relationships (users → submissions)
- ACID compliance (data integrity)
- Better for our use case

### Q: What is an ORM (Sequelize)?
A:
Instead of writing SQL:
```sql
SELECT * FROM submissions WHERE user_id = 123;
```

You write JavaScript:
```javascript
await Submission.findAll({ where: { userId: 123 } });
```

Benefits:
- Easier to write
- Less SQL injection risk
- Portable between databases

### Q: What are JWT tokens?
A:
JSON Web Tokens - used for authentication:
1. User logs in
2. Server creates a JWT token
3. User sends token with each request
4. Server verifies token

Like a movie ticket - proves you paid (logged in).

## Resources

### Official Documentation
- [Express.js](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Tutorials
- [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [REST API Tutorial](https://restfulapi.net/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Tools
- [Postman](https://www.postman.com/) - Test API endpoints
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [DB Diagram](https://dbdiagram.io/) - Design database schemas

## Next Steps

Ready to continue? We'll:
1. Install dependencies (npm install)
2. Set up PostgreSQL
3. Create database models
4. Build our first API endpoint

Let me know when you're ready to proceed! 🚀
