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
 * The base number of hours a staff member is expected to be working
 * in a given year.
 */
BASE_HOURS = 1725;

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
function calculateTeachingHours(base, allocation) {
    var load = base;

    for(var i=0;i!=allocation.length;++i) {
	var allocation_record = allocation[i];
	var course_load = allocation_record.load;
	// The course load is the proportion of teaching being
	// undertaken.  20% is allocated for coordination.
	var final_load = course_load * 0.8;
	if(allocation_record.couse_coordinator) {
            // Course coordinators get 20% additional weighting.
            final_load += course_load + 0.2;
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
	var c = allocation_record.constant_c;
	var f = allocation_record.coefficient_f;
	var n = allocation_record.efts;
	var course_hours = final_load * (c + (f * n));
	load = load + course_hours;
    }
    
    // NB: Times 2 because this should give teaching at 50%.
    return load;
}

/**
 * Calculate the teaching efts for a given course allocation.  That
 * is, the projected number of students that the given allocation is
 * teaching.
 */
function calculateTeachingEfts(allocation) {
    var efts = 0;
    for(var i=0;i!=allocation.length;++i) {
	var allocation_record = allocation[i];
	var course_load = allocation_record.load;   
	efts = efts + (allocation_record.efts * course_load);
    }    
    return efts;
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
    	var staff_base = staff[i].base;
    	staff2courses[staff_name] = { name: staff_name, base: staff_base, allocation: [] };
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
	    var course_efts = getCourseEfts(course_id,courses);
	    var constant_c = getCourseConstant(course_id,courses);
	    var coefficient_f = getCourseCoefficient(course_id,courses);
	    //
	    staff_record.allocation.push({
		name: course_id, 
		load: course_load, 
		coordinator: course_coordinator, 
		newCourse: course_new, 
		newToCourse: staff_newToCourse, 
		newStaff: staff_new,
		efts: course_efts,
		constant_c: constant_c,
		coefficient_f: coefficient_f
	    });
	}
    }

    // Done
    return staff2courses;
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
	    course_record.allocation.push({
		name: staff_name, 
		load: course_load, 
		coordinator: course_coordinator, 
		newCourse: course_new, 
		newToCourse: staff_newToCourse,
		newStaff: staff_new,
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
 * Determine the number of efts for a given course.
 */
function getCourseEfts(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].expected; 
    	}
    }
    return 0;
}

/**
 * Determine the constant c for a course.
 */
function getCourseConstant(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].constant_c; 
    	}
    }
    return 0;
}

/**
 * Determine the coefficient f for a course.
 */
function getCourseCoefficient(id,courses) {
    for(var i=0;i!=courses.length;++i) {
    	var course_id = courses[i].id;
    	if(course_id == id) { 
    	    return courses[i].coefficient_f; 
    	}
    }
    return 0;
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
	result = result + ")";
    }
    return result;
}

function toModifierString(record) {
    var modifiers = "";
    if(record["new"]) {
    	if(modifiers != "") { modifiers += ", "; }
    	modifiers += "New";
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
 * 4) List of allocations where reach record allocates a given staff
 * member to a given course.
 */
function populateTables(staff,courses,teaching) {
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
	       value.base,
	       value["new"],	       
	       value.notes);
    });
    
    // Second, populate the course table
    var courseTable = document.getElementById("courses");
    $.each(courses,function(key,value){
	var workload = value.constant_c + (value.expected * value.coefficient_f);
	addRow(courseTable,
	       value.id,
	       value.title,
	       value.trimester,
	       value.expected,
	       value.constant_c,
	       value.coefficient_f,
	       Math.round(workload),
	       toModifierString(value));
    });

    // Fourth, populate the allocation table
    var staff_allocation = calculateStaffAllocation(staff,courses,teaching);
    var course_allocation = calculateCourseAllocation(staff,courses,teaching);
        
    var allocationTable = document.getElementById("staff-allocation");
    $.each(staff_allocation,function(key,value){
	var load = calculateTeachingHours(value.base,value.allocation);
	var efts = calculateTeachingEfts(value.allocation);
	addRow(allocationTable,
	       value.name,
	       Math.round(load),
	       Math.round(efts),
	       toAllocationString(value.allocation));
    });
    
    allocationTable = document.getElementById("course-allocation");
    $.each(course_allocation,function(key,value){       
	var coverage_html = Math.round(value.coverage*100) + "%";
	// calculate status
	if(value.coverage < 0.99) {
	    coverage_html = "<div class=\"status_less\">" + coverage_html + "</div>";
	} 
	addRow(allocationTable,
	      value.name,
	      coverage_html,
	      toAllocationString(value.allocation));
    });

    // Finally, populate the overall summary table
    var summaryTable = document.getElementById("summary");
    $.each(staff,function(key,value){
	var staff_name = value.name;
	var staff_group = value.group;
        var fte = calculateEffectiveFTE(value.fte,value.buyout,value.leave);
        var admin_load = value.admin;
	var research_load = value.research;
	var teaching_load = 1.0 - (admin_load + research_load);
	var teaching_hours = calculateTeachingHours(value.base,staff_allocation[staff_name].allocation);
	var teaching_base = BASE_HOURS * fte * teaching_load;
	var teaching_workload = teaching_hours / (BASE_HOURS * fte);
	var teaching_html = Math.round(100*teaching_workload) + "% (" + Math.round(teaching_hours) + " hours)";
	var overall = Math.round(100 * (admin_load + research_load + teaching_workload));
	var overall_html;
	// calculate status
	if(overall > 120) {
	    overall_html = "<div class=\"status_less\">" + overall + "%</div>";
	} else if(overall >= 95) {
	    overall_html = "<div class=\"status_ok\">" + overall + "%</div>";
	} else  {
	    overall_html = overall + "%";
	}
	// add summary row
	addRow(summaryTable,
	       staff_name,
	       staff_group,
	       Math.round(fte*100)+"%",
	       Math.round(100*research_load) + "%",
	       Math.round(100*admin_load)+"%",
	       teaching_html,
	       overall_html);	
    });
}


