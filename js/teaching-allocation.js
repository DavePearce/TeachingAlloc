/**
 * Provides a bunch of helper methods for calculating teaching
 * allocation.
 *
 * By David J. Pearce, 2013
 */

// ===============================================================
// Constants
// ===============================================================

/**
 * The base workload sets the expected number of effective courses
 * taught by a member of staff on 50% teaching allocation (which is
 * the norm).  Observe that supervision counts towards the number of
 * effective courses taught.
 */
BASE_WORKLOAD = 4;

/**
 * The number of post graduate supervisions which is equivalent to one
 * course is set by this constant.  Thus, a staff member who is
 * supervising this number of post-graduate students will have to
 * teach one less course.
 */
POSTGRADS_PER_COURSE = 2.5;

/**
 * The maximum number of post-graduate supervisions which will be
 * counted towards teaching buy out.  This is intended to ensure that
 * supervising lots of students does not completely buy one out from
 * teaching.
 */
MAX_POSTGRAD_BUYOUT = 3.5;

/**
 * The large course mark identifies the number of students required
 * for a course to be given the "large course" modifier.  This
 * modifier increases the cost of teaching such a course, and is
 * intended to give additional weighting to courses with high numbers
 * of students.
 */
LARGE_COURSE_MARK = 80;

/**
 * The small course mark identifies the number of students below which
 * a course will be given the "small course" modifier.  This modifier
 * decreases the cost of teaching such a course, and is intended to
 * account for the relative ease of teaching a course with very few
 * students.
 */
SMALL_COURSE_MARK = 10;

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
  if(course_record.expected >= LARGE_COURSE_MARK) {
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
	var course_load = allocation_record.load;    
	
	if(allocation_record.coordinator) {
	    // A standard course will be allocated a workload cost of 1.0
	    // and an additional 0.1 will be given to the Course
	    // Coordinator (C)
	    course_load = course_load + 0.1;      
	}

	if(allocation_record.new2course) {
            // New Lectures (NL) to a course are given a 50%
            // additional weighting.
            course_load = course_load * 1.5;
	}

	if(allocation_record.newstaff) {
            // New Staff (NS) are given a 50% additional weighting.
            course_load = course_load * 1.5;
	}
	
	load = load + course_load;
    }
    
    // NB: Times 2 because this should give teaching at 50%.
    return load / (BASE_WORKLOAD * 2);
}

function calculate_supervision_load(allocation) {
    var load = 0;

    for(var i=0;i!=allocation.length;++i) {
	var allocation_record = allocation[i];
	var supervision_load = allocation_record.load;          
	load = load + supervision_load;
    }
    
    // NB: Times 2 because this should give teaching at 50%.
    return Math.min(load,MAX_POSTGRAD_BUYOUT) / (POSTGRADS_PER_COURSE * BASE_WORKLOAD * 2);
}

/**
 * Calculate the allocation of courses to individual staff members,
 * including their current workload allocation.
 */
function calculate_staff_allocation(staff,courses,teaching) {
    var staff_records = {};

    // First, initialise staff records
    for(var i=0;i!=staff.length;++i) {
    	var staff_name = staff[i].name;
    	staff_records[staff_name] = { name: staff_name, allocation: [] };
    }

    // Second, merge records together for each staff member.
    for(var i=0;i!=teaching.length;i=i+1) {
	var allocation_record = teaching[i];
	var staff_name = allocation_record.name;
	var course_name = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;	
	var staff_new2course = allocation_record["new"];
	var course_new = false; // FIXME

	if(staff_name in staff_records) {
	    // Sanity check staff member actually registered
	    var staff_record = staff_records[staff_name];
	    var staff_new = staff_record["new"];
	    staff_record.allocation.push({name: course_name, load: course_load, coordinator: course_coordinator, newcourse: course_new, new2course: staff_new2course, newstaff: staff_new});
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
function calculate_course_allocation(staff,courses,teaching) {
    var course_records = {};
    
    // First, initialise course records
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
	if(courses[i].offered) {
    	    course_records[course_id] = { name: course_id, load: 0.0, allocation: [] };
	}
    }

    // Second, merge records together for each course.
    for(var i=0;i!=teaching.length;i=i+1) {
	var allocation_record = teaching[i];
	var staff_name = allocation_record.name;
	var course_id = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;
	var staff_new2course = allocation_record["new"];
	var staff_new = false; // default

	if(course_id in course_records) {
	    // Sanity check course actually registered
	    var course_record = course_records[course_id];
	    var course_new = course_record["new"];
	    course_record.allocation.push({name: staff_name, load: course_load, coordinator: course_coordinator, "newcourse": course_new, "new2course": staff_new2course});
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
    result = result + record.name + " (";
    if("newcourse" in record && record["newcourse"]) {
       result = result + "NC,";
    }
    if("new2course" in record && record["new2course"]) {
       result = result + "NL,";
    }
    if("newstaff" in record && record["newstaff"]) {
       result = result + "NS,";
    }
    if("coordinator" in record && record.coordinator) {
       result = result + "CC,";
    }
    result = result + " " + (record.load * 100) + "%)";   
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
function populateTables(staff,courses,students,supervision,teaching) {
    
    // First, populate the staff table
    var staffTable = document.getElementById("staff");
    $.each(staff,function(key,value){
	var fte = (calculate_effective_fte(value.fte,value.buyout,value.leave) * 100) + "%";
	var research = (value.research*100)+"%";
	var teaching = (1.0-(value.research+value.admin))*100+"%";
	var admin = (value.admin*100)+"%";
	addRow(staffTable,
	       value.name,
	       fte,
	       research,
	       teaching,
	       admin,
	       value["new"],
	       value.notes);
    });
    
    // Second, populate the course table
    var courseTable = document.getElementById("courses");
    $.each(courses,function(key,value){
	var modifier = "NORMAL";
	if(value.expected >= LARGE_COURSE_MARK) {
	    modifier = "LARGE";
        } else if(value.expected <= SMALL_COURSE_MARK) {
            modifier = "SMALL";
        }
	addRow(courseTable,
	       value.id,
	       value.title,
	       value.trimester,
	       value.expected,
	       modifier,
	       value["new"],
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
    var staff_allocation = calculate_staff_allocation(staff,courses,teaching);
    var course_allocation = calculate_course_allocation(staff,courses,teaching);
        
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
	       Math.round(100*research_load) + "%",
	       Math.round(100*raw_teaching_load) + "% + " +  Math.round(100*raw_supervision_load) + "% = " + Math.round(100*teaching_load)+"%",
	       Math.round(100*admin_load)+"%",
	       Math.round(100*raw_overall_load) + " / " + (fte * 100) + " = " + Math.round(100*overall_load)+"%");	
    });
}


