import dotenv from "dotenv";
import { Report, EntryData, DischargeData, PersonalData, ReportData, DoctorData } from "../../Models/Reports";

const mysql = require("mysql2/promise");
const client = mysql.createPool("mysql://root:@localhost:3306/mydb");
console.log("Conetando com o banco...");

class DatabaseRepository {
  async getReports(): Promise<any> {
    const allData: Report[] = await client.query(`
            SELECT
            reports.*,
            patient.*,
            doctor.*,
            entry.*,
            discharge.*
    
            from reports
            inner join patient
                on reports.patient_id = patient.patient_id
            inner join doctor
                on reports.doctor_id = doctor.doctor_id
            inner join entry
                on reports.entry_id = entry.entry_id
            inner join discharge
                on reports.discharge_id = discharge.discharge_id;`);

    delete allData[1];
    return allData;
  }

  async getReportByCode(code: string): Promise<Report> {
    const foundReport = await client.query(
      `Select * from reports where report_code = ?`,
      code
    );

    if (foundReport[0].length === 0) {
      throw new Error(`Código ${code} não encontrado!`);
    }

    delete foundReport[1];
    return foundReport;
  }

  async getReportById(id: string): Promise<Report> {
    const ifReportExists = await client.query(
      `Select * from reports where procedure_id = ?`,id);

    if (ifReportExists[0].length === 0) {
      throw new Error(`Código ${id} não encontrado!`);
    }

    const foundReport = ifReportExists[0][0]



    return foundReport;
  }


  async addReport(data: Report): Promise<Report> {

      const dataBaseData = await this.getReports();

      const ifPatientDoesntExist: any = dataBaseData[0].find((item: any) => {
            return item.cpf === data.personal_data.cpf;
      });

      if(ifPatientDoesntExist === undefined){
        const patient_values = [
          data.personal_data.patient_id,
          data.personal_data.name,
          data.personal_data.first_name,
          data.personal_data.age,
          data.personal_data.city,
          data.personal_data.sex,
          data.personal_data.birthdate,
          data.personal_data.cpf,
          data.personal_data.mother_name,
          data.personal_data.relative_name,
          data.personal_data.relative_first_name,
          data.personal_data.familiar_stand,
          data.personal_data.phone,
        ];
    
        const addedPatient: PersonalData = await client.query(
          `INSERT INTO patient
                (patient_id, last_name, first_name, age, city, sex, birthdate, cpf, mother_name, relative_name, relative_first_name, familiar_stand, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, patient_values);

      } else {
        data.personal_data.patient_id = ifPatientDoesntExist.patient_id
      }

    const entry_values = [
      data.entry_data.entry_id,
      data.entry_data.entry_date,
      data.entry_data.symptoms,
      data.entry_data.previous_diagnosis,
      data.entry_data.clinical_conditions,
      data.entry_data.note,
    ];

    const addedEntry: EntryData = await client.query(
      `INSERT INTO entry
        (entry_id, entry_date, symptoms, previous_diagnosis, clinical_conditions, note) 
        VALUES (?, ?, ?, ?, ?, ?); `, entry_values);

    const discharge_values = [
      data.discharge_data.discharge_id,
      data.discharge_data.discharge_date,
      data.discharge_data.discharge_cause,
      data.discharge_data.note,
    ];

    const addedDischarge: DischargeData = await client.query(
      ` INSERT INTO discharge
            (discharge_id, discharge_date, discharge_cause, note) 
            VALUES (?, ?, ?, ?);`, discharge_values);

    const doctor_values = [
      data.doctor_data.doctor_id,
      data.doctor_data.doctor_name,
      data.doctor_data.doctor_first_name,
    ];

    const addedDoctor: DoctorData = await client.query(
      `INSERT INTO doctor 
            (doctor_id, doctor_name, doctor_first_name)
             VALUES (?, ?, ?);`, doctor_values);


    const report_values = [
      data.procedure_data.procedure_id,
      data.procedure_data.report_code,
      data.procedure_data.procedure_name,
      data.procedure_data.bed,
      data.procedure_data.procedure_status,
      data.procedure_data.procedure_date,
      data.procedure_data.note,
      data.personal_data.patient_id,
      data.doctor_data.doctor_id,
      data.entry_data.entry_id,
      data.discharge_data.discharge_id,
    ];

    const addedReport: ReportData = await client.query(
      `INSERT INTO reports
            (procedure_id, report_code, procedure_name, bed, procedure_status, procedure_date, note, patient_id, doctor_id, entry_id, discharge_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, report_values);

    return this.getReportByCode(data.procedure_data.report_code);
  }

  async updateReport(data: Report, id: string): Promise<Report> {
    return data;
  }

  async deleteReport(id: string): Promise<string> {

      const foundData: Report = await this.getReportById(id);

      await client.query(`DELETE FROM reports WHERE procedure_id = ?`, id);

      return `Registro deletado`;
  }
}

export default DatabaseRepository;
