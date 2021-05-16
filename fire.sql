use HealthCareData;

create table user_details (
    user_id int NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    user_name VARCHAR(255) UNIQUE,
    email_id VARCHAR(255) UNIQUE,
    user_type VARCHAR(255),
    password VARCHAR(255),
    PRIMARY KEY (user_id,user_name)
);

CREATE TABLE available_ips (
    IP VARCHAR(255),
    PRIMARY KEY(IP)
);

CREATE TABLE appointments (
    appointment_id VARCHAR(255),
    pid INT,
    did INT,
    dateAndTime timestamp not null default current_timestamp,
    status VARCHAR(255),
    description VARCHAR(255),
    PRIMARY KEY(appointment_id)
);

CREATE TABLE permission (
    pid int,
    did int,
    PRIMARY KEY (pid,did),
    FOREIGN KEY (pid) REFERENCES user_details(user_id),
    FOREIGN KEY (did) REFERENCES user_details(user_id)
);
