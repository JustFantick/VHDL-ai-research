
LIBRARY ieee;
USE ieee.std_logic_1164.ALL;

ENTITY up_down_counter IS
  PORT (Clk, Rst, UpDw: IN std_logic;
        count: OUT std_logic_vector (3 DOWNTO 0));
END up_down_counter;

ARCHITECTURE mealy_beh OF up_down_counter IS
  TYPE Statetype IS (S0, S1, S2, S3);
  SIGNAL Currstate, Nextstate: Statetype;

BEGIN

  StateReg: PROCESS (Clk, Rst)
  BEGIN
    IF (Rst = '1') THEN
      Currstate <= S0;
    ELSIF (Clk = '1' AND Clk'EVENT) THEN
      Currstate <= Nextstate;
    END IF;
  END PROCESS;

  CombLogic: PROCESS (Currstate, UpDw)
  BEGIN
    Nextstate <= S0;
    CASE Currstate IS
      WHEN S0 => 
             IF (UpDw = '0') THEN 
               Nextstate <= S3;
               count <= "0001";
             ELSE
               Nextstate <= S1;
               count <= "0100";
             END IF;
      WHEN S1 =>
             IF (UpDw = '0') THEN 
               Nextstate <= S0;
               count <= "1000";
             ELSE
               Nextstate <= S2;
               count <= "0010";
             END IF;
      WHEN S2 =>
             IF (UpDw = '0') THEN 
               Nextstate <= S1;
               count <= "0100";
             ELSE
               Nextstate <= S3;
               count <= "0001";
             END IF;
      WHEN S3 =>
             IF (UpDw = '0') THEN 
               Nextstate <= S2;
               count <= "0010";
             ELSE
               Nextstate <= S0;
               count <= "1000";
             END IF;
      END CASE;
  END PROCESS;

END mealy_beh;