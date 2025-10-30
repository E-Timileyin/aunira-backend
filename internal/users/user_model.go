package users

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	ID        uint   `gorm:"primarykey"`
	Name      string `gorm:"not null"`
	Email     string `gorm:"unique;not null"`
	Phone     string `gorm:"unique"`
	Password  string `gorm:"not null"`
	Role      string `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
