/**
 * Provides a bunch of helper methods for calculating teaching
 * allocation.
 *
 * By David J. Pearce, 2013
 */

// ===============================================================
// Load Calculations
// ===============================================================

/**
 * Calculate the effective FTE of a staff member.  This is determined
 * starting from their base FTE (i.e. as determined by their
 * employment contract), less any leave they are taking and/or buy out
 * they have (e.g. from grants).
 */ 
function calculate_effective_fte(fte,buyout,leave) {
  return Math.max(0,fte - buyout - leave);
}

/**
 * Calculate the load for a given course.  This is set at 1.0 for the
 * normal case, and is adjusted for these criteria:
 *
 * 1) A large course is considered > 80 students, and given an
 *    additional 0.15 loading.
 * 
 * 2) A new course is given a 100% additional loading in its first
 *    year, and a 50% additional loading in its second.
 */
function calculate_course_load(course_record) {
  // 
  // FIXME: This calculation is incorrect!
  //
  if(course_record.expected >= 80) {
     return 1.15;
  } else {
     return 1.0;
  }
}

/**
 * Calculate the teaching load for a given course allocation.
 */
function calculate_teaching_load(allocation) {
  var load = 0;
  for(var i=0;i!=allocation.length;++i) {
      var allocation_record = allocation[i];
      var course_load = 1 * allocation_record.load;    
      
      if(allocation_record.coordinator) {
	  // A standard course will be allocated a workload cost of 1.0
	  // and an additional 0.1 will be given to the Course
	  // Coordinator (C)
	  course_load = course_load + 0.1;      
      }
      
      load = load + course_load;
  }

  // NB: in calculation below, 3 for normal number of courses, 2
  // because shared between supervision.
    return load / (3*4);
}

function calculate_supervision_load(allocation) {
    var load = 0;

    for(var i=0;i!=allocation.length;++i) {
	var allocation_record = allocation[i];
	var supervision_load = allocation_record.load;          
	load = load + supervision_load;
    }
    
    // NB: max supervision is 2.5PG
    return Math.min(load,2.5) / (4 * 2.5);
}

/**
 * Calculate the allocation of courses to individual staff members,
 * including their current workload allocation.
 */
function calculate_staff_allocation(allocation_records,staff) {
    var staff_records = {};

    // First, initialise staff records
    for(var i=0;i!=staff.length;++i) {
    	var staff_name = staff[i].name;
    	staff_records[staff_name] = { name: staff_name, allocation: [] };
    }

    // Second, merge records together for each staff member.
    for(var i=0;i!=allocation_records.length;i=i+1) {
	var allocation_record = allocation_records[i];
	var staff_name = allocation_record.name;
	var course_name = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;	

	if(staff_name in staff_records) {
	    // Sanity check staff member actually registered
	    var staff_record = staff_records[staff_name];
	    staff_record.allocation.push({name: course_name, load: course_load, coordinator: course_coordinator});
	}
    }
    return staff_records;
}

/**
 * Calculate the allocation of courses to individual staff members,
 * including their current workload allocation.
 */
function calculate_staff_supervision(supervision_records,staff) {
    var staff_records = {};

    // First, initialise staff records
    for(var i=0;i!=staff.length;++i) {
    	var staff_name = staff[i].name;
    	staff_records[staff_name] = { name: staff_name, allocation: [] };
    }

    // Second, merge records together for each staff member.
    for(var i=0;i!=supervision_records.length;i=i+1) {
    	var supervision_record = supervision_records[i];
    	var student_name = supervision_record.student;
    	var staff_name = supervision_record.supervisor;
    	var supervision_load = supervision_record.load;

    	if(staff_name in staff_records) {
    	    // Sanity check staff member actually registered
    	    var staff_record = staff_records[staff_name];
    	    staff_record.allocation.push({name: student_name, load: supervision_load});
    	}
    }
    return staff_records;
}

/**
 * Calculate the allocation of staff to individual courses, including
 * their current workload allocation.  Note that courses which are not
 * offered are ignored.
 */
function calculate_course_allocation(allocation_records,courses) {
    var course_records = {};
    
    // First, initialise course records
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
	if(courses[i].offered) {
    	    course_records[course_id] = { name: course_id, load: 0.0, allocation: [] };
	}
    }

    // Second, merge records together for each course.
    for(var i=0;i!=allocation_records.length;i=i+1) {
	var allocation_record = allocation_records[i];
	var staff_name = allocation_record.name;
	var course_id = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;

	if(course_id in course_records) {
	    // Sanity check course actually registered
	    var course_record = course_records[course_id];
	    course_record.allocation.push({name: staff_name, load: course_load, coordinator: course_coordinator});
	    course_record.load += course_load;
	} 
    }
    return course_records;
}

// ===============================================================
// GUI Helpers
// ===============================================================

/**
 * Convert an array of allocation records into a sensible string
 */
function to_allocation_string(records) {
  var result = "";
  for(var i=0;i!=records.length;++i) {
    if(i != 0) { result = result + ", "; }
    var record = records[i];
    result = result + record.name;
    if("coordinator" in record && record.coordinator) {
       result = result + "*";
    }
    result = result + " (" + (record.load * 100) + "%)";   
  }
  return result;
}

/**
 * Add a row of data to a given HTML table, whilst ensuring this is
 * properly annotated with an ID to ensure correct CSS styling
 * (e.g. that rows have alternativing colours, etc). 
 */
function addRow(table,value) {
  var row=table.insertRow(-1);
  var length = table.rows.length;
  if (length%2 == 1) { row.id="odd"; }
  else { row.id="even"; }
  for(i = 1; i < arguments.length;++i) {
    row.insertCell(i-1).innerHTML=arguments[i];
  }
}

/**
 * The master function which is responsible for populating the various
 * tables in the html document.  This accepts the four data items,
 * which are:
 *
 * 1) List of staff and their details (e.g. FTE, etc)
 *
 * 2) List of courses and their details (e.g. estimated enrollements,
 * etc))
 *
 * 3) List of postgraduate students and their details (e.g. degree,
 * supervisors, etc)
 *
 * 4) List of allocations where reach record allocates a given staff
 * member to a given course.
 */
function populateTables(staff,courses,students,supervision,allocation) {
    
    // First, populate the staff table
    var staffTable = document.getElementById("staff");
    $.each(staff,function(key,value){
      var fte = (calculate_effective_fte(value.fte,value.buyout,value.leave) * 100) + "%";
      var research = (value.research*100)+"%";
      var teaching = (value.teaching*100)+"%";
      var admin = (value.admin*100)+"%";
      addRow(staffTable,
	     value.name,
	     fte,
	     research,
	     teaching,
	     admin,
	     value.notes);
    });

    // Second, populate the course table
    var courseTable = document.getElementById("courses");
    $.each(courses,function(key,value){
       addRow(courseTable,
	      value.id,
	      value.title,
	      value.trimester,
	      value.expected,
	      value.offered);
    });

    // Third, populate the students table
    var studentsTable = document.getElementById("students");
    $.each(students,function(key,value){
       addRow(studentsTable,
	      value.name,
	      value.degree);
    });

    // Fourth, populate the supervision table
    var supervisionTable = document.getElementById("supervision");
    var supervision_allocation = calculate_staff_supervision(supervision,staff);
    $.each(supervision_allocation,function(key,value){
	var load = calculate_supervision_load(value.allocation);
    	addRow(supervisionTable,
	       value.name,
	       Math.round(load*100)+"%",
	       to_allocation_string(value.allocation));
    });

    // Fifth, populate the allocation table
    var staff_allocation = calculate_staff_allocation(allocation,staff);
    var course_allocation = calculate_course_allocation(allocation,courses);
        
    var allocationTable = document.getElementById("staff-allocation");
    $.each(staff_allocation,function(key,value){       
	var load = calculate_teaching_load(value.allocation);
	addRow(allocationTable,
	       value.name,
	       Math.round(load*100) + "%",
	       to_allocation_string(value.allocation));
    });
    
    allocationTable = document.getElementById("course-allocation");
    $.each(course_allocation,function(key,value){       
       addRow(allocationTable,
	      value.name,
	      value.load,
	      to_allocation_string(value.allocation));
    });

    // Finally, populate the overall summary table
    var summaryTable = document.getElementById("summary");
    $.each(staff,function(key,value){
	var staff_name = value.name;
        var fte = calculate_effective_fte(value.fte,value.buyout,value.leave);
        var admin_load = value.admin;
	var raw_teaching_load = calculate_teaching_load(staff_allocation[staff_name].allocation);
	var raw_supervision_load = calculate_supervision_load(supervision_allocation[staff_name].allocation);
	var teaching_load = raw_teaching_load + raw_supervision_load;
	var research_load = value.research;
	var raw_overall_load = admin_load + teaching_load + research_load;
	var overall_load = raw_overall_load / fte;
	addRow(summaryTable,
	       staff_name,
	       Math.round(fte*100)+"%",
	       "<b>" + Math.round(100*research_load) + "%</b>",
	       Math.round(100*raw_teaching_load) + "% + " +  Math.round(100*raw_supervision_load) + "% = <b>" + Math.round(100*teaching_load)+"</b>%",
	       "<b>" + Math.round(100*admin_load)+"%</b>",
	       fte + " x " + Math.round(100*raw_overall_load) + " = <b>" + Math.round(100*overall_load)+"%</b>");	
    });
}


