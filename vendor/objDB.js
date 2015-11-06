/**
*  --- objDB ---
*
*  Copyright (c) 2012 Harry Oosterveen
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

/**
*  @author  Harry Oosterveen <mail@harryonline.net>
*  @version 20
*  @since   2012-11-06
*/

/**
* Changes
* 1.0 Initial version
* 1.1 Added replaceRow (2012-12-15)
* 20  Version numbering as in Script version, fixed caching bug after data manipulation in spreadsheets (2012-12-19)
*/

var objDB = function() {
  var objDB = {};
  /**
  *  Open database or spreadsheet
  *  @param {string} dbString  jdbc connection string or unique identifier for spreadsheet
  *  @param {string} user (jdbc only)
  *  @param {string} pass  (jdbc only)
  *  @return {object} handler for further operations
  */
  function open( dbString, user, pass )
  {
    if( dbString.match( /^jdbc:/ )) {
       return new jdbc( dbString, user, pass );
    } else {
      return new ss( dbString );
    }
  }

  /**
  *  Set the rows to skip in sheets (spreadsheets only)
  *  so first row contains headers and second and below data
  *  similar to JS array splice function
  *  @param {object} handler
  *  @param {string} table name of sheet
  *  @param {int} index number of first row to skip, as in right margin in spreadsheet view
  *  @param {int} howMany number of rows to remove
  */
  function setSkipRows( handler, table, index, howMany )
  {
    return handler.setSkipRows( table, index, howMany );
  }

  /**
  *  Close the database connection (jdbc only)
  *  @param {object} handler
  */
  function close( handler )
  {
    handler.close();
  }

  /**
  *  Do a simple query without getting results, (jdbc only)
  *  useful for modifying, creating and deleting tables
  *  @param {object} handler
  *  @param {string} query  simple query to be executed
  *  @return {boolean} indicating success or failure.
  */
  function query( handler, query )
  {
    return handler.query( query );
  }

  /**
  *  Do an update query without getting results, (jdbc only)
  *  use for INSERT, DELETE, UPDATE
  *  @param {object} handler
  *  @param {string} query  simple query to be executed
  *  @return {int} nr. of rows affected?
  */
  function update( handler, query )
  {
    return handler.update( query );
  }

  /**
  *  Get result rows from a SELECT query (jdbc only)
  *  @param {object} handler
  *  @param {string} query SELECT query to be executed
  *  @return {array} array of objects, objects have column labels as keys
  */
  function getRowsByQuery ( handler, query )
  {
    return handler.getRowsByQuery( query );
  }

  /**
  *  Get result rows: columns from table where cond
  *  @param {object} handler
  *  @param {string} table database table
  *  @param {array} columns list of columns, use all columns if no array or empty array
  *  @param {object} cond key/value pairs for selecting rows
  *  @param {int} limit max number of rows returned
  *  @return {array} array of objects, objects have column labels as keys
  */
  function getRows ( handler, table, columns, cond, limit )
  {
    return handler.getRows( table, columns, cond, limit );
  }

  /**
  *  Get key of last insert statement (jdbc only)
  *  @param {object} handler
  *  @return {int}
  */
  function insertId ( handler )
  {
    return handler.insertId();
  }

  /**
  *  Insert a row in the database
  *  @param {object} handler
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs in row that will be inserted
  *  @return {int} nr. of rows affected?
  */
  function insertRow( handler, table, values ) 
  {
    return handler.insertRow( table, values );
  }

  /**
  *  Update a row in the database
  *  @param {object} handler
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs that will be set in row
  *  @param {object} cond key/value pair to identify row(s) to be updated
  *  @return {int} nr. of rows affected?
  */
  function updateRow( handler, table, values, cond ) 
  {
    return handler.updateRow( table, values, cond );
  }

  /**
  *  Replace a row in the database--insert if the row does not exist yet
  *  @param {object} handler
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs that will be set in row
  *  @param {object} cond key/value pair to identify row(s) to be updated
  *  @return {int} nr. of rows affected?
  */
  function replaceRow( handler, table, values, cond ) 
  {
    return handler.replaceRow( table, values, cond );
  }

  /**
  *  Delete a row from the database
  *  @param {object} handler
  *  @param {string} table table in which row is set
  *  @param {object} cond key/value pair to identify row(s) to be deleted
  *  @return {int} nr. of rows affected?
  */
  function deleteRow ( handler, table, cond ) 
  {
    return handler.deleteRow( table, cond );
  }

  /**
  *  Write error information to logger
  *  @private
  *  @param {object} e error object
  */

  function logError_( e ) {
    Logger.log( '%s in line %s: %s', e.name, e.lineNumber, e.message );
    Logger.log( e.stack.match( /\([^\)]*\)/g ).reverse().join(' > ').replace( /[\(\)]/g, ''));
  }

  // BEGIN jdbc.gs
  /**
  *  --- objDB ---
  *
  *  Copyright (c) 2012 Harry Oosterveen
  *
  *  Licensed under the Apache License, Version 2.0 (the "License");
  *  you may not use this file except in compliance with the License.
  *  You may obtain a copy of the License at
  *
  *      http://www.apache.org/licenses/LICENSE-2.0
  *
  *  Unless required by applicable law or agreed to in writing, software
  *  distributed under the License is distributed on an "AS IS" BASIS,
  *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  *  See the License for the specific language governing permissions and
  *  limitations under the License.
  */

  /**
  *  @author  Harry Oosterveen <mail@harryonline.net>
  *  @version 20
  *  @since   2012-11-06
  */

  /**
  *  Create object and connect to jdbc database
  *
  *  @param {string} url
  *  @param {string} user
  *  @param {string} pass
  */
  var jdbc = function( url, user, pass )
  {
    try {
      this.conn = Jdbc.getConnection( url, user, pass );
    } catch( e ) {
      logError_(e);
    }
  }

  /**
  *  Close the database connection
  */
  jdbc.prototype.close = function()
  {
    if( this.conn != undefined ) {
      this.conn.close();
    }
  }

  /**
  *  Do a simple query without getting results,
  *  useful for modifying, creating and deleting tables
  *  @param {string} query  simple query to be executed
  *  @return {boolean} indicating success or failure.
  */
  jdbc.prototype.query = function( query )
  {
    try {
      var stmt = this.conn.createStatement();
      var ret = stmt.execute( query );
      Logger.log( query );
      stmt.close();
      return ret;
    } catch( e ) {
      logError_(e);
      stmt.close();
      return false;
    }
  }

  /**
  *  Do an update query without getting results,
  *  use for INSERT, DELETE, UPDATE
  *  @param {string} query  simple query to be executed
  *  @return {int} nr. of rows affected?
  */
  jdbc.prototype.update = function( query )
  {
    try {
      var stmt = this.conn.createStatement();
      var ret = stmt.executeUpdate( query );
      Logger.log( query );
      stmt.close();
      return ret;
    } catch( e ) {
      logError_(e);
      stmt.close();
      return false;
    }
  }

  /**
  *  Get result rows from a SELECT query
  *  @param {string} query SELECT query to be executed
  *  @return {array} array of objects, objects have column labels as keys
  */
  jdbc.prototype.getRowsByQuery = function( query )
  {
    try {
      var stmt = this.conn.createStatement();
      var rs = stmt.executeQuery( query );
      Logger.log( query );

      var meta=rs.getMetaData();
      var cols=meta.getColumnCount();
      var info=[];
      for( var i =1;  i <= cols; i ++ ) {
        info[i] = { label:meta.getColumnLabel(i), type:meta.getColumnTypeName(i) }
      }
      
      var ret = [];
      while( rs.next()) {
        var row = {};
        for( var i=1;  i <= cols; i ++ ) {
          if( rs.getString(i) ) {
            switch( info[i].type ) {
              case 'INT' :
                row[info[i].label] = rs.getInt(i);
                break;
              case 'DATETIME' :
              case 'TIMESTAMP' :
                var nums = rs.getString(i).match( /\d+/g );
                row[info[i].label] = new Date( nums[0], nums[1]-1, nums[2], nums[3], nums[4], nums[5] );
                break;
              case 'DATE' :
                var nums = rs.getString(i).match( /\d+/g );
                row[info[i].label] = new Date( nums[0], nums[1]-1, nums[2] );
                break;
              case 'TIME' :
                var nums = rs.getString(i).match( /\d+/g );
                row[info[i].label] = new Date( 1970, 0, 1, nums[0], nums[1], nums[2] );
                break;
              default :
                row[info[i].label] = rs.getString(i);
                break;
            }
          }
        }
        ret.push( row );
      }
    } catch( e ) {
      logError_(e);
    }
    if( rs != undefined ) {
      rs.close();
    }
    stmt.close();
    return ret;
  }

  /**
  *  Get result rows: columns from table where cond
  *  @param {string} table database table
  *  @param {array} columns list of columns, use all columns if no array or empty array
  *  @param {object} cond key/value pairs for selecting rows
  *  @param {int} limit max number of rows returned
  *  @return {array} array of objects, objects have column labels as keys
  */
  jdbc.prototype.getRows = function( table, columns, cond, limit )
  {
    var query = 'SELECT DISTINCT ';
    if( typeof( columns ) != 'object' || columns.length == 0 ) {
      query += '*';
    } else {
      query += columns.toString();
    }
    query += ' from ' + table;
    if( typeof( cond ) == 'object' ) {
      var condString = obj2set_( cond, ' AND ' );
      if( condString != '' ) {
        query += ' WHERE ' + condString;
      }
    }
    if( limit != undefined ) {
      query += ' LIMIT ' + limit;
    }
    return this.getRowsByQuery( query );
  }

  /**
  *  Get key of last insert statement
  *  @return {int}
  */
  jdbc.prototype.insertId = function()
  {
    try {
      var stmt = this.conn.createStatement();
      var rs = stmt.executeQuery('SELECT LAST_INSERT_ID()');
      rs.next();
      ret = rs.getInt(1);
    } catch( e ) {
      logError_(e);
    }
    rs.close();
    stmt.close();
    return ret;
  }

  /**
  *  Insert a row in the database
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs in row that will be inserted
  *  @return {int} nr. of rows affected?
  */
  jdbc.prototype.insertRow = function( table, values ) {
    var query = 'INSERT INTO ' + table + ' SET ' + obj2set_( values );
    return this.update( query );
  }

  /**
  *  Update a row in the database
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs that will be set in row
  *  @param {object} cond key/value pairs to identify row(s) to be updated
  *  @return {int} nr. of rows affected?
  */
  jdbc.prototype.updateRow = function( table, values, cond ) {
    var query = 'UPDATE ' + table + ' SET ' + obj2set_( values );
    if( cond != undefined ) {
      query += ' WHERE ' +  obj2set_( cond, ' AND ' );
    };
    return this.update( query );
  }

  /**
  *  Replace a row in the database, new row will be inserted if no matching row found
  *  @param {string} table table in which row is set
  *  @param {object} values key/value pairs in row that will be replaced
  *  @param {object} cond key/value pairs to identify row(s) to be updated
  *  @return {int} nr. of rows affected?
  */
  jdbc.prototype.replaceRow = function( table, values, cond ) {
    var query = 'REPLACE INTO ' + table + ' SET ' + obj2set_( values ) + ', ' + obj2set_( cond );
    return this.update( query );
  }

  /**
  *  Delete a row in the database
  *  @param {string} table table in which row is set
  *  @param {object} cond key/value pair to identify row(s) to be deleted
  *  @return {int} nr. of rows affected?
  */
  jdbc.prototype.deleteRow = function( table, cond ) {
    var query = 'DELETE FROM ' + table;
    if( cond != undefined ) {
      query += ' WHERE ' +  obj2set_( cond, ' AND ' );
    };
    return this.update( query );
  }

  /** 
  *  Convert obj to string for SET query part
  *  @private
  *  @parameter {object} obj object to be converted
  *  @parameter {string} sep separator, default = ', '
  *  @return {array} list of key="value" strings, separated by sep
  */
  function obj2set_( obj, sep ) {
    var setList = [];
    for( var field in obj ) {
      if( obj[field] != undefined ) {
        if( obj[field].getTime ) {
          var tz = new Date().toString().match( /\([^\)]+/ )[0].substr(1);
          setList.push( '`' + field + '`="' + Utilities.formatDate(obj[field], tz, 'yyyy-MM-dd HH:mm:ss') + '"' );
        } else if( typeof obj[field] == 'object' && obj[field].length > 0 ) {
          setList.push( '`' + field + '` IN ' + Utilities.jsonStringify( obj[field]).replace( '[', '(').replace(']', ')' ));
        } else {
          setList.push( '`' + field + '`="' + addslashes_(obj[field].toString()) + '"' );
        }
      }
    }
    if( sep==undefined ) {
      sep = ', ';
    }
    return setList.join( sep );
  }

  /**
  *  Prepare string for use in DB query by escaping chracters
  *  @see http://stackoverflow.com/a/11716317
  *  @private
  */
  function addslashes_(string) {
      return string.replace(/\\/g, '\\\\').
          replace(/\u0008/g, '\\b').
          replace(/\t/g, '\\t').
          replace(/\n/g, '\\n').
          replace(/\f/g, '\\f').
          replace(/\r/g, '\\r').
          replace(/'/g, '\\\'').
          replace(/"/g, '\\"');
  }
  // END jdbc.gs

  // BEGIN ss.gs
  /**
  *  --- objDB ---
  *
  *  Copyright (c) 2012 Harry Oosterveen
  *
  *  Licensed under the Apache License, Version 2.0 (the "License");
  *  you may not use this file except in compliance with the License.
  *  You may obtain a copy of the License at
  *
  *      http://www.apache.org/licenses/LICENSE-2.0
  *
  *  Unless required by applicable law or agreed to in writing, software
  *  distributed under the License is distributed on an "AS IS" BASIS,
  *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  *  See the License for the specific language governing permissions and
  *  limitations under the License.
  */

  /**
  *  @author  Harry Oosterveen <mail@harryonline.net>
  *  @version 20
  *  @since   2012-11-06
  */

  /**
  *  create object and open spreadsheet
  *  @param {string} ssId Unique identifier for the spreadsheet to be opened
  */
  var ss = function( ssId )
  {
    try {
      this.ss = SpreadsheetApp.openById(ssId);
      this.cache = { table:[], data:{}};
      this.skipRows = {};
    } catch( e ) {
      logError_( e );
    }
  }

  /**
  *  Set the rows to skip in sheets
  *  so first row contains headers and second and below data
  *  similar to JS array splice function
  *  @param {string} table name of sheet
  *  @param {int} list of 1-based rows (row number as in right margin in spreadsheet view)
  *  @param {int} howMany number of rows to remove
  */
  ss.prototype.setSkipRows = function( table, index, howMany )
  {
    this.skipRows[table] = {index:index-1, howMany:howMany};
  }

  /**
  *  Get selected columns from rows in table where cond is true
  *  @param {string} table name of sheet
  *  @param {array} columns list of columns, use all columns if no array or empty array
  *  @param {object} cond key/value pairs for selecting rows
  *  @param {int} limit max number of rows returned
  *  @return {array} array of objects, objects have column labels as keys
  */
  ss.prototype.getRows = function( table, columns, cond, limit )
  {
    try {
      var ret=[];
      var tData = this.sheetData(table);

      if( typeof( columns ) != 'object' || columns.length == 0 ) {
        var fields = tData.headers;
      } else {
        var fields = {};
        for( var c=0;  c < columns.length;  c++ ) {
          var idx = tData.headers.indexOf( columns[c] );
          if( idx != -1 ) {
            fields[idx] = columns[c];
          }
        }
      }
      
      cond = parseCond_( cond, tData.headers );
      var rowCount = 0;
      for( var r = 1; r < tData.data.length; r++ ) {
        if( testCond_( cond, tData.data[r] )) {
          var obj = {};
          var hasData = false;
          for( var c in fields ) {
            var cellData = tData.data[r][c];
            // Check for content
            if( typeof( cellData ) != 'string' || cellData != '' ) {
              obj[fields[c]] = cellData;
              hasData = true;
            }
          }
          if( hasData ) {
            ret.push( obj );
            rowCount++;
            if( limit != undefined && rowCount >= limit ) {
              break;
            }
          }
        }
      }
      return ret;
    } catch( e ) {
      logError_( e );
      return false;
    }
  }

  /**
  *  Insert a row in the spreadsheet
  *  @param {string} table name of sheet
  *  @param {object} values key/value pairs that will be set in row
  *  @return {int} nr. of rows affected
  */
  ss.prototype.insertRow = function( table, values ) 
  {
    return this.manipulate( table, 'insert', values );
  }

  /**
  *  Update a row in the spreadsheet
  *  @param {string} table name of sheet
  *  @param {object} values key/value pairs that will be set in row
  *  @param {object} cond key/value pairs for selecting rows
  *  @return {int} nr. of rows affected
  */
  ss.prototype.updateRow = function( table, values, cond )
  {
    return this.manipulate( table, 'update', values, cond );
  }

  /**
  *  Replace a row in the spreadsheet, similar to updateRow, but will insert if not matching row found
  *  @param {string} table name of sheet
  *  @param {object} values key/value pairs that will be replaced
  *  @param {object} cond key/value pairs to identify row(s) to be updated
  *  @return {int} nr. of rows affected
  */
  ss.prototype.replaceRow = function( table, values, cond ) {
    return this.manipulate( table, 'replace', values, cond );
  }

  ss.prototype.manipulate = function( table, mode, values, cond )
  {
    try {
      var tData = this.sheetData(table);
      // Map values to fields
      var fields = {};
      var maxIdx = 0;
      for( var c in values ) {
        var idx = tData.headers.indexOf( c );
        if( idx != -1 ) {
          fields[idx] = values[c];
          if( idx > maxIdx ) {
            maxIdx = idx;
          }
        }
      }
      var rowCount = 0;

      switch( mode ) {
        case 'update' :
        case 'replace' :
          // Update matching rows
          var pCond = parseCond_( cond, tData.headers );
          for( var r = 1; r < tData.data.length; r++ ) {
            if( testCond_( pCond, tData.data[r] )) {
              this.setRow( tData, fields, maxIdx, r ); 
              rowCount ++;
            }
          }
          if( mode == 'update' || rowCount > 0 ) {
            break;
          }
          // Proceed if replace and no matches found
          // Add conditions as values to be inserted
          for( var c in cond ) {
            var idx = tData.headers.indexOf( c );
            if( idx != -1 ) {
              fields[idx] = cond[c];
              if( idx > maxIdx ) {
                maxIdx = idx;
              }
            }
          }
          // Now similar to insert
        case 'insert' :
          // Insert new row
          this.setRow( tData, fields, maxIdx ); 
          rowCount ++;
      }
      this.clearSheetData(table);
    return rowCount;
    } catch( e ) {
      logError_( e );
      return false;
    }
  }

  /**
  *  Delete a row from the spreadsheet
  *  @param {string} table name of sheet
  *  @param {object} cond key/value pairs for selecting rows
  *  @return {int} nr. of rows affected
  */
  ss.prototype.deleteRow = function( table, cond ) {
    try {
      var tData = this.sheetData(table);

      var pCond = parseCond_( cond, tData.headers );
      var rowCount = 0;
      for( var r = tData.data.length-1; r >= 1; r-- ) {
        // Loop down to keep integrity of remaining rows after deleting
        if( testCond_( pCond, tData.data[r] )) {
          tData.sheet.deleteRow(tData.rowIndex[r]);
          rowCount ++;
        }
      }
      this.clearSheetData(table);
      return rowCount;
    } catch( e ) {
      logError_( e );
      return false;
    }
  }

  /**
  *  Get sheetdata, and cache for subsequent calls
  *  @private
  *  @param {string} table name of sheet
  *  @return {object} data for sheet
  */
  ss.prototype.sheetData = function( table )
  {
    var idx = this.cache.table.indexOf( table );
    if( idx == -1 ) {
      // Not cached, so read data from sheet
      var tData = {expired:true};  // No valid row data loaded yet
      tData.sheet = this.ss.getSheetByName(table);
      // Insert into cache
      idx = this.cache.table.push( table )-1;
      this.cache.data[idx] = tData;
    } else {
      var tData = this.cache.data[idx];
    }
    if( tData.expired )  {
      // Load row data
      tData.rows =  tData.sheet.getDataRange();
      tData.rowIndex = [];
      for (var r = 0;  r < tData.rows.getNumRows();  r ++ ) {
        tData.rowIndex.push( r+1);
      }
      tData.data = tData.rows.getValues();
      if( this.skipRows[table] != undefined ) {
        tData.data.splice(this.skipRows[table].index, this.skipRows[table].howMany);
        tData.rowIndex.splice(this.skipRows[table].index, this.skipRows[table].howMany);
      }
      tData.headers = normalizeList_( tData.data[0] );
      tData.expired = false;
      this.cache.data[idx] = tData;
    }
    return tData;
  } 

  /**
  *  Clear sheetdata, used after manipulating the sheet
  *  @private
  *  @param {string} table name of sheet
  */

  ss.prototype.clearSheetData = function( table )
  {
    var idx = this.cache.table.indexOf( table );
    if( idx != -1 ) {
      this.cache.data[idx].expired = true;
    }
  } 

  /**
  *  Set values in given row
  *  @private
  *  @param (object) tData table (sheet) data
  *  @param (object) fields data to be set
  *  @param {int} maxIdx max. column index
  *  @param {int} r row number, append row if undefined
  *  @return
  */
  ss.prototype.setRow = function( tData, fields, maxIdx, r )
  {
    debugger;
    var row = [];
    for( var c=0;  c <= maxIdx; c ++ ) {
      if( fields[c] == undefined ) {
        row.push(  r == undefined ? '' : tData.data[r][c] );
      } else {
        row.push( fields[c] );
      }
    }
    var rowNumber = r == undefined ? tData.sheet.getLastRow()+1 : tData.rowIndex[r];
    var range = tData.sheet.getRange( rowNumber, 1, 1, maxIdx+1 );
    range.setValues([row]);
  }


  /**
  *  Convert cond parameter to list of index/array pairs, 
  *  keys are replaced by index of key in headers and 
  *  values are made arrays, if they are not
  *  @private
  *  @param {object} cond key/values pairs
  *  @param {array} headers
  *  @return {object} index/array pairs
  */
  function parseCond_( cond, headers )
  {
    var ret={};
    if( cond != undefined ) {
      for( var key in cond ) {
        var idx = headers.indexOf( key );
        if( idx != -1 ) {
          //  Always store cond as array
          ret[idx] = cond[key];
        }
      }
    }
    return ret;
  }

  /**
  *  Test whether row values match cond
  *  @private
  *  @param {object} cond key/values pairs
  *  @param {array} row list of values
  *  @return {boolean} test result
  */
  function testCond_( cond, row )
  {
    var match = true;
    for( var c in cond ) {
      if( typeof( cond[c] ) != 'object' ) {
        // string or numeric
        match = cond[c] == row[c];
      } else if( cond[c].indexOf != undefined ) {
        // array
        match = cond[c].indexOf(row[c]) != -1;
      } else {
        // other object
        match = cond[c].toString() == row[c].toString();
      }
      if( !match ) {
        break;
      }
    }
    return match;
  }

  /**
  *  Normalize array of strings
  *  @private
  *  @param {array} list array of strings
  *  @return {string}
  */
  function normalizeList_( list ) {
    var ret = [];
    for( var i=0;  i < list.length; i ++ ) {
      ret.push( normalize_( list[i] ));
    }
    return ret;
  }

  /**
  *  Normalize a string so it can be used as JavaScript object property names
  *  by removing all non-numeric characters and leading digits
  *  @private
  *  @param {string} text
  *  @return {string}
  */

  function normalize_( text ) {
    return text.replace( /\W+/g, '' ).replace( /^\d+/, '' );
  }

  /*
  * Merge two objects, adds attributes of second object to first one and returns first object
  * attributes in obj2 will overwrite obj1 if the same name
  * @param {object} obj1
  * @param {object} obj1
  * @param {object} merged object1
  */
  function mergeObjects_( obj1, obj2 ) 
  {
    for( var i in obj2 ) {
      obj1[i] = obj2[i];
    }
    return obj1;
  }
  // END ss.gs
  objDB.open = open;
  objDB.setSkipRows = setSkipRows;
  objDB.close = close;
  objDB.query = query;
  objDB.update = update;
  objDB.getRowsByQuery = getRowsByQuery; 
  objDB.getRows = getRows; 
  objDB.insertId = insertId; 
  objDB.insertRow = insertRow;
  objDB.updateRow = updateRow;
  objDB.replaceRow = replaceRow;
  objDB.deleteRow = deleteRow; 
  
  return objDB;
}();
