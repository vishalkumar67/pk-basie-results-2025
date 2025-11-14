-- Table for storing exam results
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  marks INTEGER NOT NULL,
  grade TEXT NOT NULL,
  details TEXT
);

-- Sample Data
INSERT INTO results(roll, name, class, marks, grade, details) VALUES
('1234444', 'Ali Khan', 'SSC-II', 789, 'A+', 'Sample details for Ali');
