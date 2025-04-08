# Use the official Node.js image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Install json-server-auth globally
RUN npm install -g json-server-auth json-server express

# Copy the database file into the container
COPY db1.json .

# Expose the port json-server-auth will run on
EXPOSE 3000

# Start json-server-auth
CMD ["json-server", "db1.json", "--port", "3000", "--middlewares", "node_modules/json-server-auth"]


# 2. **Build the Docker Image**:
#    ```bash
#    docker build -t json-server-auth .
#    ```
#
# 3. **Run the Docker Container**:
#    ```bash
#    docker run -p 3000:3000 json-server-auth
#    ```
