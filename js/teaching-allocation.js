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
function calculateEffectiveFTE(fte,buyout,leave) {
  return Math.max(0,fte - buyout - leave);
}

/**
 * Calculate the teaching load for a given course allocation.
 */
function calculateTeachingLoad(allocation) {
    var load = 0;
    for(var i=0;i!=allocation.length;++i) {
	var allocation_record = allocation[i];
	var course_load = allocation_record.load;    
	var final_load = course_load;
	if(allocation_record.coordinator) {
	    // A standard course will be allocated a workload cost of 1.0
	    // and an additional 0.1 will be given to the Course
	    // Coordinator (C)
	    final_load += 0.1;      
	}
	if(allocation_record.largeCourse) {
	    // A standard course will be allocated a workload cost of 1.0
	    // and an additional 0.15 will be given for Large courses (L).
	    final_load += course_load * 0.15;      
	}
	if(allocation_record.strategicCourse) {
	    // A standard course will be allocated a workload cost of 1.0
	    // and an additional 0.15 will be given for Large courses (L).
	    final_load += course_load * 0.15;      
	}
	if(allocation_record.newToCourse) {
            // New Lectures (NL) to a course are given a 50%
            // additional weighting.
            final_load += course_load * 0.5;
	}
	if(allocation_record.newStaff) {
            // New Staff (NS) are given a 50% additional weighting.
            final_load += course_load * 0.5;
	}
	if(allocation_record.newCourse) {
            // New Courses (NC) are given a 50% additional weighting.
            final_load += course_load * 0.5;
	}
	
	load = load + final_load;
    }
    
    // NB: Times 2 because this should give teaching at 50%.
    return load / (BASE_WORKLOAD * 2);
}

function calculateSupervisionLoad(allocation) {
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
function calculateStaffAllocation(staff,courses,teaching) {
    var staff2courses = {};

    // First, initialise staff records
    for(var i=0;i!=staff.length;++i) {
    	var staff_name = staff[i].name;
    	staff2courses[staff_name] = { name: staff_name, allocation: [] };
    }

    // Second, merge records together for each staff member.
    for(var i=0;i!=teaching.length;i=i+1) {
	var allocation_record = teaching[i];
	var staff_name = allocation_record.name;
	var course_id = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;	
	var staff_newToCourse = allocation_record["new"];

	if(staff_name in staff2courses) {
	    // Sanity check staff member actually registered
	    var staff_record = staff2courses[staff_name];
	    var staff_new = isStaffNew(staff_name,staff);
	    var course_new = isCourseNew(course_id,courses);
	    var course_large = isCourseLarge(course_id,courses);
	    var course_small = isCourseSmall(course_id,courses);
	    var course_strategic = isCourseStrategic(course_id,courses);

	    staff_record.allocation.push({
		name: course_id, 
		load: course_load, 
		coordinator: course_coordinator, 
		newCourse: course_new, 
		newToCourse: staff_newToCourse, 
		newStaff: staff_new,
		largeCourse: course_large,
		smallCourse: course_small,
		strategicCourse: course_strategic
	    });
	}
    }

    // Done
    return staff2courses;
}

/**
 * Calculate the allocation of courses to individual staff members,
 * including their current workload allocation.
 */
function calculateStaffSupervision(supervision_records,staff) {
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

    // Done
    return staff_records;
}

/**
 * Calculate the allocation of staff to individual courses, including
 * their current workload allocation.  Note that courses which are not
 * offered are ignored.
 */
function calculateCourseAllocation(staff,courses,teaching) {
    var courses2staff = {};
    
    // First, initialise course records
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
	var course_new = courses[i]["new"];
	if(courses[i].offered) {
    	    courses2staff[course_id] = { name: course_id, coverage: 0.0, allocation: [] };
	}
    }

    // Second, merge records together for each course.
    for(var i=0;i!=teaching.length;i=i+1) {
	var allocation_record = teaching[i];
	var staff_name = allocation_record.name;
	var course_id = allocation_record.course;
	var course_load = allocation_record.load;
	var course_coordinator = allocation_record.coordinator;
	var staff_newToCourse = allocation_record["new"];

	if(course_id in courses2staff) {
	    // Sanity check course actually registered
	    var course_record = courses2staff[course_id];
	    var staff_new = isStaffNew(staff_name,staff);
	    var course_new = isCourseNew(course_id,courses);
	    var course_large = isCourseLarge(course_id,courses);
	    var course_small = isCourseSmall(course_id,courses);
	    var course_strategic = isCourseStrategic(course_id,courses);

	    course_record.allocation.push({
		name: staff_name, 
		load: course_load, 
		coordinator: course_coordinator, 
		newCourse: course_new, 
		newToCourse: staff_newToCourse,
		newStaff: staff_new,
		largeCourse: course_large,
		smallCourse: course_small,
		strategicCourse: course_strategic
	    });
	    course_record.coverage += course_load;
	} 
    }

    // Done
    return courses2staff;
}

// ===============================================================
// Misc Helpers
// ===============================================================

/**
 * Determine whether a given member of staff is considered "new" (NS).
 * New members of staff get various discounts related to teaching.
 */
function isStaffNew(name,staff) {
    for(var i=0;i!=staff.length;++i) {
    	var staff_name = staff[i].name;
	var staff_new = staff[i]["new"];
	if(staff_name == name) { return staff_new; }
    }
    return false;
}

/**
 * Determine whether a given course is considered "new" (NC).  Members
 * of staff get various discounts related to teaching new courses.
 */
function isCourseNew(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i]["new"]; 
    	}
    }
    return false;
}

/**
 * Determine whether a given course is considered "large" (L).  Members
 * of staff get various discounts related to teaching large courses.
 */
function isCourseLarge(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].expected >= LARGE_COURSE_MARK; 
    	}
    }
    return false;
}

/**
 * Determine whether a given course is considered "small" (S).  Members
 * of staff get less discount for teaching small courses.
 */
function isCourseSmall(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].expected <= SMALL_COURSE_MARK; 
    	}
    }
    return false;
}

/**
 * Determine whether a given course is considered "stategic" (T).  Members
 * of staff get various discounts related to teaching strategic courses.
 */
function isCourseStrategic(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].strategic; 
    	}
    }
    return false;
}


// ===============================================================
// GUI Helpers
// ===============================================================

/**
 * Convert an array of allocation records into a sensible string
 */
function toAllocationString(records) {
    var result = "";
    for(var i=0;i!=records.length;++i) {
	if(i != 0) { result = result + ", "; }
	var record = records[i];
	result = result + record.name + " (" + (record.load * 100) + "%";   
	if(record.newCourse) {
	    result = result + ",NC";
	}
	if(record.newToCourse) {
	    result = result + ",NL";
	}
	if(record.newStaff) {
	    result = result + ",NS";
	}
	if(record.coordinator) {
	    result = result + ",CC";
	} 
	if(record.largeCourse) {
	    result = result + ",L";
	}
	if(record.smallCourse) {
	    result = result + ",S";
	}
	if(record.strategicCourse) {
	    result = result + ",T";
	}
	result = result + ")";
    }
    return result;
}

function toModifierString(record) {
    var modifiers = "";
    if(record.expected >= LARGE_COURSE_MARK) {
    	modifiers += "Large";
    } else if(record.expected <= SMALL_COURSE_MARK) {
        modifiers += "Small";
    }
    if(record["new"]) {
    	if(modifiers != "") { modifiers += ", "; }
    	modifiers += "New";
    }
    if(record.strategic) {
    	if(modifiers != "") { modifiers += ", "; }
    	modifiers += "Strategic";
    }
    if(!record.offered) {
    	if(modifiers != "") { modifiers += ", "; }
    	modifiers += "Not Offered";
    }
    return modifiers;
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
	var fte = (calculateEffectiveFTE(value.fte,value.buyout,value.leave) * 100) + "%";
	var research = (value.research*100)+"%";
	var teaching = (1.0-(value.research+value.admin))*100+"%";
	var admin = (value.admin*100)+"%";
	addRow(staffTable,
	       value.name,
	       value.group,
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
	addRow(courseTable,
	       value.id,
	       value.title,
	       value.trimester,
	       value.expected,
	       toModifierString(value));
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
    var supervision_allocation = calculateStaffSupervision(supervision,staff);
    $.each(supervision_allocation,function(key,value){
	var load = calculateSupervisionLoad(value.allocation);
    	addRow(supervisionTable,
	       value.name,
	       Math.round(load*100)+"%",
	       toAllocationString(value.allocation));
    });

    // Fifth, populate the allocation table
    var staff_allocation = calculateStaffAllocation(staff,courses,teaching);
    var course_allocation = calculateCourseAllocation(staff,courses,teaching);
        
    var allocationTable = document.getElementById("staff-allocation");
    $.each(staff_allocation,function(key,value){       
	var load = calculateTeachingLoad(value.allocation);
	addRow(allocationTable,
	       value.name,
	       Math.round(load*100) + "%",
	       toAllocationString(value.allocation));
    });
    
    allocationTable = document.getElementById("course-allocation");
    $.each(course_allocation,function(key,value){       
       addRow(allocationTable,
	      value.name,
	      value.coverage,
	      toAllocationString(value.allocation));
    });

    // Finally, populate the overall summary table
    var summaryTable = document.getElementById("summary");
    $.each(staff,function(key,value){
	var staff_name = value.name;
        var fte = calculateEffectiveFTE(value.fte,value.buyout,value.leave);
        var admin_load = value.admin;
	var raw_teaching_load = calculateTeachingLoad(staff_allocation[staff_name].allocation);
	var raw_supervision_load = calculateSupervisionLoad(supervision_allocation[staff_name].allocation);
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


