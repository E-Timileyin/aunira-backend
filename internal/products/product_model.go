package products

import (
	"time"

	"gorm.io/gorm"
)

type Products struct {
	gorm.Model

	ID          uint   `gorm:"primarykey"`
	Name        string `gorm:"not null"`
	Product     string `gorm:"not null"`
	Price       string `gorm:"unique;not null"`
	Stock       string `gorm:"unique"`
	Category_ID uint   `gorm:"primarykey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time      `gorm:"not null"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}
