-- server/init.sql
-- Ejecutar en MySQL: mysql -u <user> -p fasbit < server/init.sql

CREATE TABLE IF NOT EXISTS theses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT,
  author TEXT,
  student_id VARCHAR(255),
  email VARCHAR(255),
  abstract TEXT,
  advisor VARCHAR(255),
  career VARCHAR(255),
  year INT,
  keywords TEXT,
  status VARCHAR(50),
  downloads INT DEFAULT 0,
  pdf_filename VARCHAR(255),
  approval_filename VARCHAR(255),
  `fulltext` LONGTEXT,
  created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50),
  created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
