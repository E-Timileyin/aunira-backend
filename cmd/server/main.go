package main

import (
	"log"
	"net/http"
	"os"

	"github.com/E-Timileyin/aunira-backend/database"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(".env.local"); err != nil {
		log.Printf("Warning: .env.local file not found: %v", err)
	}

	r := gin.Default()
	database.ConnectDB()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "Hea;th Check Successful;")
	})

	r.Run(":" + port)
}
